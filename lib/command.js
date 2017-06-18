const Rx = require('rx');

const Response = require('./response');
const CommandContext = require('./command-context');

class Command {
  constructor(options) {
    let defaultOptions = {
      name: 'Name',
      description: '\u200B',
      adminOnly: false,
      args: [],

      run(message, response) {
        response.type = Response.TYPE_NONE;
        return Rx.Observable.just(response);
      },
    };

    for (let property in defaultOptions) {
      let defaultValue = defaultOptions[property];
      let optionValue = options[property];

      this[property] = typeof optionValue !== 'undefined' ? optionValue : defaultValue;
    }
  }

  get requiredArgs() {
    return this.args.filter((arg) => arg.required);
  }

  runCommand(message, nix) {
    let commandParts = message.content.split(' ');
    let argsArray = commandParts.slice(1); //Discard the name portion of the message

    if (this.adminOnly && message.member.id !== nix.owner.id) {
      let response = new Response(Response.TYPE_NONE);
      return response.respondTo(message);
    }

    if (Command.argsIncludeHelpFlag(argsArray)) {
      return this.helpResponse(message).respondTo(message);
    }

    if (argsArray.length < this.requiredArgs.length) {
      let response = this.helpResponse(message);
      response.content = "I'm missing some information for that command:";
      return response.respondTo(message);
    }

    let argsObject = {};
    this.args.forEach((cmdArg, index) => {
      let msgArg = argsArray[index];

      if (!msgArg) {
        argsObject[cmdArg.name] = cmdArg.default;
      } else {
        argsObject[cmdArg.name] = msgArg;
      }
    });

    let context = new CommandContext(message, argsObject, nix);
    return this.run(context)
      .flatMap((response) => response.respondTo(message));
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

Command.msgIsCommand = function(message, commands) {
  if (message.content.indexOf('!') !== 0) {
    return false;
  }

  let commandName = message.content.split(' ')[0].slice(1);
  return typeof commands[commandName] !== 'undefined';
};

module.exports = Command;
