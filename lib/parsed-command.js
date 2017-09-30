const Rx = require('rx');

const Response = require('./response');

class ParsedCommand {
  /**
   *
   * @param command
   * @param context
   */
  constructor(command, context) {
    this._command = command;
    this._context = context;
  }

  get command () {
    return this._command;
  }

  get context() {
    return this._context;
  }

  run() {
    let response = new Response(this.context.message);

    if (this.command.adminOnly) {
      if (this.context.user.id !== this.context.nix.owner.id) {
        return Rx.Observable.empty();
      }
    }

    if (this.context.hasFlag('help')) {
      return sendHelpResponse(this.context.message, this.command);
    }

    if (Object.keys(this.context.args).length < this.command.requiredArgs.length) {
      let content = this.context.nix.responseStrings.commandParsing.error.missingArgument;
      return sendHelpResponse(this.context.message, this.command, content);
    }

    return this.command.run(this.context, response);
  }
}

function sendHelpResponse(message, command, content = '') {

  let usageField = {
    name: 'Usage',
    value: '!' + command.name,
  };

  let argsList = [];
  let flagsList = [];

  command.flags
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

  command.args
    .filter((arg) => typeof arg.showInHelp === 'undefined' || arg.showInHelp === true)
    .forEach((arg) => {
      if (arg.required) {
        usageField.value += ' <' + arg.name + '>';
        argsList.push('**' + arg.name + '**: ' + arg.description);
      } else {
        usageField.value += ' [' + arg.name + ']';
        argsList.push('*' + arg.name + '*: (optional) ' + arg.description);
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

  let response = new Response(message, 'embed', content, embed);
  return response.send();
}

module.exports = ParsedCommand;
