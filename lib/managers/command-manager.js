const { from } = require('rxjs');
const { tap, flatMap, toArray, filter } = require('rxjs/operators');

const Command = require('../models/command');
const { toObservable } = require("../utility");

class CommandManager {
  constructor(chaos) {
    this._chaos = chaos;
    this._commands = {};

    //Bind methods for aliasing to ChaosCore
    this.addCommand = this.addCommand.bind(this);
    this.getCommand = this.getCommand.bind(this);

    this.chaos.on('chaos.listen', () => this.onChaosListen());
  }

  get chaos() {
    return this._chaos;
  }

  get commands() {
    // replace the keys with the case sensitive names
    return Object.values(this._commands);
  }

  onChaosListen() {
    return from(this.commands).pipe(
      filter((command) => command.onListen),
      tap((command) => this.chaos.logger.warn(
        `onListen in command ${command.pluginName}.${command.name} is deprecated. ` +
        `Please use chaos.on('chaos.listen', () => {}) instead`,
      )),
      flatMap((command) => toObservable(command.onListen())),
      toArray(),
    );
  }

  /**
   * Registers a new command
   *
   * @param plugin {string} the name of the plugin the command belongs to
   * @param command {Object, Class, Command} options for command, a class that
   *  inherits Command, or a command object
   */
  addCommand(plugin, command) {
    if (!command) {
      this.chaos.logger.warn("addCommand(command) is deprecated. Please use addCommand(plugin, command)");
      command = plugin;
      plugin = command.pluginName;
    }

    if (command instanceof Command) {
      if (command.chaos !== this.chaos) {
        throw TypeError("Command is bound to a different instance of ChaosCore.");
      }
    } else if (command.prototype instanceof Command) {
      command = new command(this.chaos);
    } else {
      command = new Command(this.chaos, command);
    }

    command.pluginName = plugin;
    command.validate();

    if (this._commands[command.name.toLowerCase()]) {
      let error = new Error(`Command '${command.name}' has already been added.`);
      error.name = "CommandAlreadyAdded";
      throw(error);
    }

    this._commands[command.name.toLowerCase()] = command;
    this.chaos.logger.verbose(`Loaded command: ${command.name}`);

    return command;
  }

  getCommand(commandName) {
    let command = this._commands[commandName.toLowerCase()];

    if (!command) {
      let error = new Error(`Command '${commandName}' does not exist`);
      error.name = "CommandNotFoundError";
      throw(error);
    }

    return command;
  }
}

module.exports = CommandManager;
