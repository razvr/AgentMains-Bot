const Response = require('./response');

class Command {
  constructor(options) {
    let allowedProps = [
      'name',
      'description',
      'args',
      'flags',
      'adminOnly',
      'showInHelp',
      'run',
    ];

    this.name = 'Name';
    this.description = '\u200B';
    this.args = [];
    this.flags = [];
    this.adminOnly = false;
    this.showInHelp = true;

    allowedProps.forEach((property) => {
      let optionValue = options[property];
      if (typeof optionValue !== 'undefined') {
        this[property] = optionValue;
      }
    });

    this.flags.push({
      name: 'help',
      shortAlias: 'h',
      type: 'boolean',
      description: "Display help for this command",
      showInHelp: false,
    });
  }

  get requiredArgs() {
    return this.args.filter((arg) => arg.required);
  }

  helpResponse() {
    let usage = '!' + this.name;
    let argsList = [];
    let flagsList = [];

    if (this.flags.length >= 1) {
      this.flags
        .filter((flag) => typeof flag.showInHelp === 'undefined' || flag.showInHelp === true)
        .forEach((flag) => {
        let helpLineName = '';
        let helpLineAlias = '';
        let helpLineDesc = '';

        if (flag.shortAlias) {
          helpLineAlias = ' (' + flag.shortAlias + ')';
        }

        if (flag.required) {
          usage += ' --' + flag.name;

          helpLineName = '**--' + flag.name + '**';
          helpLineDesc = ': (optional) ' + flag.description;
        } else {
          usage += ' [--' + flag.name + ']';

          helpLineName = '**--' + flag.name + '**';
          helpLineDesc = ': (optional) ' + flag.description;
        }

        flagsList.push(helpLineName + helpLineAlias + helpLineDesc);
      });
    }

    if (this.args.length >= 1) {
      this.args
        .filter((arg) => typeof arg.showInHelp === 'undefined' || arg.showInHelp === true)
        .forEach((arg) => {
        if (arg.required) {
          usage += ' <' + arg.name + '>';
          argsList.push('**' + arg.name + '**: ' + arg.description);
        } else {
          usage += ' [' + arg.name + ']';
          argsList.push('*' + arg.name + '*: (optional) ' + arg.description);
        }
      });
    }

    let response = new Response(Response.TYPE_EMBED);
    response.embed.setTitle(this.name);
    response.embed.setDescription(this.description);
    response.embed.addField('Usage', usage);

    if (argsList.length >= 1) {
      response.embed.addField('Arguments', argsList.join('\n'));
    }

    if (flagsList.length >= 1) {
      response.embed.addField('Flags', flagsList.join('\n'));
    }

    return response;
  }
}

Command.argsIncludeHelpFlag = function(args) {
  return args.indexOf('--help') !== -1 || args.indexOf('-h') !== -1;
};

module.exports = Command;
