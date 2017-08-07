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

    let argsArray = [];

    let argsObject = {};
    let flagsObject = {};

    //Filter out flags from the inputs
    inputs.forEach((input) => {
      let flagMatch = input.match(/--(\w+)|-(\w)/);

      if (flagMatch) {
        let flagName = flagMatch[1];
        let shortAlias = flagMatch[2];

        if (typeof flagName === "undefined") {
          if (shortAlias === "h") {
            flagName = 'help';
          } else {
            //TODO: find full flag
            return; //for now skip the flag
          }
        }

        flagsObject[flagName] = true;
      } else {
        argsArray.push(input);
      }
    });

    command.args.forEach((arg) => {
      let value = argsArray.shift();

      if (typeof value !== "undefined") {
        argsObject[arg.name] = value;
      } else if (typeof arg.default !== "undefined") {
        argsObject[arg.name] = arg.default;
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
