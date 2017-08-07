const CommandContext = require('./command-context');
const ParsedCommand = require('./parsed-command');

COMMAND_PREFIX = '!';

class CommandReader {
  constructor () {
    this._commands = {};
  }

  get commands () {
    return this._commands;
  }

  addCommand(command) {
    console.log("adding command", command.name);
    this.commands[command.name] = command;
  }

  msgIsCommand(message) {
    if (!message.content.startsWith(COMMAND_PREFIX)) {
      return false;
    }

    let commandName = message.content.split(' ')[0].slice(1);
    return typeof this.commands[commandName] !== 'undefined';
  }

  parse(message, nix) {
    let commandData = this._parseMessage(message);

    let command = commandData.command;
    let inputs = commandData.inputs;

    let argIndex = 0;

    let argsObject = {};
    let flagsObject = {};

    //Filter out flags from the inputs
    for(let i = 0; i < inputs.length; i += 1) {
      let input = inputs[i];

      let flagMatch = input.match(/--(\w+)|-(\w)/);

      if (flagMatch) {
        let flagName = flagMatch[1];
        let shortAlias = flagMatch[2];
        let flag;

        if (flagName) {
          flag = command.flags.find((flag) => flag.name === flagName);
        } else if (shortAlias) {
          flag = command.flags.find((flag) => flag.shortAlias === shortAlias);
        }

        if (flag.type === "boolean") {
          flagsObject[flag.name] = true;
        } else {
          i += 1; //increment so that the next value isn't mistaken for an argument
          flagsObject[flag.name] = inputs[i];
        }
      } else {
        let arg = command.args[argIndex];
        argsObject[arg.name] = input;
      }
    }

    command.args.forEach((arg) => {
      if (typeof argsObject[arg.name] === "undefined" && typeof arg.default !== "undefined") {
        argsObject[arg.name] = arg.default;
      }
    });

    command.flags.forEach((flag) => {
      if (typeof flagsObject[flag.name] === "undefined" && typeof flag.default !== "undefined") {
        flagsObject[flag.name] = flag.default;
      }
    });

    let context = new CommandContext(message, argsObject, flagsObject, nix);
    return new ParsedCommand(command, context);
  }

  _parseMessage(message) {
    let msgParts = message.content.split(/ (.+)/); //split into name and input parts

    let name = msgParts[0].slice(COMMAND_PREFIX.length); //slice to strip the command prefix
    let command = this.commands[name];

    let inputs = [];

    if (typeof msgParts[1] !== "undefined") {
      let values = msgParts[1].match(/\{.*\}|"[^"]*"|'[^']*'|\S+/g);
      if (values) {
        inputs = values;
      }
    }

    return {
      command: command,
      inputs: inputs,
    };
  }
}

module.exports = CommandReader;
