const ChaosManager = require('../models/chaos-manager');
const Command = require('../models/command');
const { CommandNotFoundError } = require("../errors");
const { CommandAlreadyAdded } = require("../errors");

class CommandManager extends ChaosManager {
  constructor(chaos) {
    super(chaos);
    this._commands = {};

    //Bind methods for aliasing to ChaosCore
    this.addCommand = this.addCommand.bind(this);
    this.getCommand = this.getCommand.bind(this);
  }

  get commands() {
    // replace the keys with the case sensitive names
    return Object.values(this._commands);
  }

  /**
   * Registers a new command
   *
   * @param pluginName {string} the name of the plugin the command belongs to
   * @param command {Object, Class, Command} options for command, a class that
   *  inherits Command, or a command object
   */
  addCommand(pluginName, command) {
    if (command instanceof Command) {
      if (command.chaos !== this.chaos) {
        throw TypeError("Command is bound to a different instance of ChaosCore.");
      }
    } else if (command.prototype instanceof Command) {
      command = new command(this.chaos);
    } else {
      command = new Command(this.chaos, command);
    }

    command.pluginName = pluginName;
    command.validate();

    if (this._commands[command.name.toLowerCase()]) {
      let error = new CommandAlreadyAdded(`Command '${command.name}' has already been added.`);
      throw(error);
    }

    this._commands[command.name.toLowerCase()] = command;
    this.chaos.logger.verbose(`Loaded command: ${command.name}`);

    return command;
  }

  getCommand(commandName) {
    let command = this._commands[commandName.toLowerCase()];

    if (!command) {
      let error = new CommandNotFoundError(`Command '${commandName}' does not exist`);
      throw(error);
    }

    return command;
  }
}

module.exports = CommandManager;
