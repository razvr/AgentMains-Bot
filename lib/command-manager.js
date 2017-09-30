const Command = require('./command');
const CommandContext = require('./command-context');
const ParsedCommand = require('./parsed-command');

class CommandManager {
  constructor (commands = [], commandPrefix = '!') {
    this._commands = {};
    this._commandPrefix = commandPrefix;

    commands.forEach((command) => {
      this.addCommand(command);
    });
  }

  get commands () {
    return this._commands;
  }

  get commandPrefix () {
    return this._commandPrefix;
  }

  /**
   * Registers a new command
   *
   * @param command {Object}
   *   @param command.name {string} The name of the command
   *   @param command.description {string} The description of the command
   *   @param command.args {Array<Object>} List of arguments for the command
   *     @pram command.args[].name {string} The name of the argument
   *     @pram command.args[].description {string} The description of the argument
   *     @pram command.args[].required {boolean} Mark the argument as required
   *     @pram command.args[].showInHelp {boolean} Hide or show argument in the help list
   *   @param command.flags {Array<Object>} List of flags for the command
   *     @pram command.flags[].name {string} The name of the flag
   *     @pram command.flags[].description {string} The description of the flag
   *     @pram command.flags[].required {boolean} Mark the flag as required
   *     @pram command.flags[].type {string} The type of the flag. Can be "string", or "boolean"
   *     @pram command.flags[].showInHelp {boolean} Hide or show flag in the help list
   *   @param command.adminOnly {boolean} Hide the command unless the caller is an admin
   *   @param command.showInHelp {boolean} Hide or show command in the help list
   *   @param command.run {function(CommandContext): ObservableOrPromise} function to call as the body of the command
   */
  addCommand(command) {
    console.log("adding command", command.name);
    this.commands[command.name] = new Command(command);
  }

  msgIsCommand(message) {
    if (!message.content.startsWith(this._commandPrefix)) {
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

      let flagMatch = input.match(/^--(\w+)$|^-(\w)$/);

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
        argIndex += 1;
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

    let name = msgParts[0].slice(this._commandPrefix.length); //slice to strip the command prefix
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

module.exports = CommandManager;
