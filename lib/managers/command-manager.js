const Rx = require('rx');

const Command = require('../models/command');
const { toObservable } = require("../utility");

class CommandManager {
  get nix() {
    return this._nix;
  }

  get commands() {
    // replace the keys with the case sensitive names
    return Object.values(this._commands);
  }

  constructor(nix) {
    this._nix = nix;
    this._commands = {};

    //Bind methods for aliasing to NixCore
    this.addCommand = this.addCommand.bind(this);
    this.getCommand = this.getCommand.bind(this);
  }

  configureCommands() {
    return Rx.Observable.from(this.commands)
      .do((command) => this.nix.logger.debug(`Configure Command: ${command.name}`))
      .filter((command) => command.configureCommand)
      .flatMap((command) => toObservable(command.configureCommand()))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }

  /**
   * Registers a new command
   *
   * @param command {Object} options for command
   */
  addCommand(command) {
    command = new Command(this.nix, command);

    if (this._commands[command.name.toLowerCase()]) {
      let error = new Error(`Command '${command.name}' has already been added.`);
      error.name = "CommandAlreadyAdded";
      throw(error);
    }

    this._commands[command.name.toLowerCase()] = command;
    this.nix.logger.verbose(`Loaded command: ${command.name}`);
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
