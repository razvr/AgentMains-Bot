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

  run() {
    let response = new Response(this._context.message);

    if (this._command.adminOnly) {
      if (this._context.message.author.id !== this._context.nix.owner.id) {
        return Rx.Observable.empty();
      }
    }

    if (this._context.hasFlag('help')) {
      return sendHelpResponse(this._context.message, this._command);
    }

    if (Object.keys(this._context.args).length < this._command.requiredArgs.length) {
      let content = "I'm sorry, but I'm missing some information for that command:";
      return sendHelpResponse(this._context.message, this._command, content);
    }

    return this._command.run(this._context, response);
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
