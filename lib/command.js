const Rx = require('rx');

const Response = require('./response');

class Command {
  constructor(options) {
    let allowedProps = [
      'name',
      'description',
      'args',
      'adminOnly',
      'run',
    ];

    this.name = 'Name';
    this.description = '\u200B';
    this.args = [];
    this.adminOnly = false;

    allowedProps.forEach((property) => {
      let optionValue = options[property];
      if (typeof optionValue !== 'undefined') {
        this[property] = optionValue;
      }
    });
  }

  get requiredArgs() {
    return this.args.filter((arg) => arg.required);
  }

  helpResponse() {
    let argsList = [];
    let usage = '!' + this.name;

    if (this.args.length >= 1) {
      this.args.forEach((arg) => {
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

    return response;
  }
}

Command.argsIncludeHelpFlag = function(args) {
  return args.indexOf('--help') !== -1 || args.indexOf('-h') !== -1;
};

module.exports = Command;
