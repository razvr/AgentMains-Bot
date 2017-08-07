const CommandContext = require('./command-context');
const ParsedCommand = require('./parsed-command');

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
    if (message.content.indexOf('!') !== 0) {
      return false;
    }

    let commandName = message.content.split(' ')[0].slice(1);
    return typeof this.commands[commandName] !== 'undefined';
  }

  parse(message, nix) {
    let commandParts = message.content.split(' ');
    let commandName = commandParts[0].slice(1); //slice to strip the command prefix
    let command = this.commands[commandName];

    let inputArray = commandParts.slice(1); //Discard the name portion of the message
    let argsObject = {};
    let flagsObject = {};

    command.args.forEach((arg, index) => {
      let value = inputArray.shift();

      if (index === command.args.length - 1 && inputArray.length >= 1) {
        value += ' ' + inputArray.join(' ');
      }

      if (typeof value === "undefined") {
        argsObject[arg.name] = arg.default;
      } else {
        argsObject[arg.name] = value;
      }
    });

    let context = new CommandContext(message, argsObject, flagsObject, nix);
    return new ParsedCommand(command, context);
  }
}

module.exports = CommandReader;
