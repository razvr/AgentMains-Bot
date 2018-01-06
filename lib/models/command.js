const Response = require('./response');

class Command {
  constructor(options) {
    let allowedProps = [
      'name',
      'description',
      'moduleName',
      'args',
      'flags',
      'permissions',
      'ownerOnly',
      'adminOnly',
      'showInHelp',
      'enabledByDefault',
      'run',
    ];

    this.name = 'Name';
    this.description = '\u200B';
    this.moduleName = undefined;
    this.args = [];
    this.flags = [];
    this.ownerOnly = false;
    this.adminOnly = false;
    this.permissions = [];
    this.showInHelp = true;
    this.enabledByDefault = true;
    this.run = () => {};

    allowedProps.forEach((property) => {
      let optionValue = options[property];
      if (typeof optionValue !== 'undefined') {
        this[property] = optionValue;
      }
    });

    if (this.ownerOnly && this.name.indexOf('owner:') !== 0) {
      this.name = 'owner:' + this.name;
    }

    if (this.adminOnly && this.permissions.length === 0) {
      this.permissions = ['admin'];
    }

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

  helpEmbed() {
    let usageField = {
      name: 'Usage',
      value: '!' + this.name,
    };

    let argsList = [];
    let flagsList = [];

    this.flags
      .filter((flag) => typeof flag.showInHelp === 'undefined' || flag.showInHelp === true)
      .forEach((flag) => {
        let namePart = '';
        let aliasPart = '';
        let descPart = '';

        if (flag.shortAlias) {
          aliasPart = '( -' + flag.shortAlias + ' )';
        }

        if (flag.required) {
          usageField.value += ' --' + flag.name;
          namePart = '**--' + flag.name + '** ' + aliasPart;
          descPart = flag.description;
        } else {
          usageField.value += ' [--' + flag.name + ']';
          namePart = '*--' + flag.name + '* ' + aliasPart;
          descPart = '(optional) ' + flag.description;
        }

        flagsList.push(namePart + ': ' + descPart);
      });

    this.args
      .filter((arg) => typeof arg.showInHelp === 'undefined' || arg.showInHelp === true)
      .forEach((arg) => {
        if (arg.required) {
          usageField.value += ' <' + arg.name + '>';
          argsList.push('**' + arg.name + '**: ' + arg.description);
        } else {
          usageField.value += ' [' + arg.name + ']';
          argsList.push('**' + arg.name + '** (optional): ' + arg.description);
        }
      });

    let embed = {
      title: this.name,
      description: this.description,
      fields: [usageField],
    };

    if (argsList.length >= 1) {
      embed.fields.push({
        name: 'Arguments',
        value: argsList.join('\n'),
      });
    }

    if (flagsList.length >= 1) {
      embed.fields.push({
        name: 'Flags',
        value: flagsList.join('\n'),
      });
    }

    return embed;
  }
}

module.exports = Command;
