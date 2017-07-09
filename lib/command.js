const Rx = require('rx');

const Response = require('./response');
const CommandContext = require('./command-context');

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

    this.run = (message, response) => {
      response.type = Response.TYPE_NONE;
      return Rx.Observable.just(response);
    };

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

  runCommand(message, nix) {
    let commandParts = message.content.split(' ');
    let argsArray = commandParts.slice(1); //Discard the name portion of the message

    if (this.adminOnly && message.author.id !== nix.owner.id) {
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

   this.args.forEach((arg, index) => {
      let value = argsArray.shift();

      if (index === this.args.length - 1 && argsArray.length >= 1) {
        value += ' ' + argsArray.join(' ');
      }

      if (typeof value === "undefined") {
        argsObject[arg.name] = arg.default;
      } else {
        argsObject[arg.name] = value;
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
