const Rx = require('rx');

const Command = require('../models/command');
const { toObservable } = require("../utility");

class CommandManager {
  get chaos() {
    return this._chaos;
  }

  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  get commands() {
    // replace the keys with the case sensitive names
    return Object.values(this._commands);
  }

  constructor(chaos) {
    this._chaos = chaos;
    this._commands = {};

    //Bind methods for aliasing to NixCore
    this.addCommand = this.addCommand.bind(this);
    this.getCommand = this.getCommand.bind(this);
  }

  onListen() {
    return Rx.Observable.from(this.commands)
      .do((command) => this.chaos.logger.debug(`onListen command: ${command.pluginName}/${command.name}`))
      .flatMap((command) => {
        if (command.configureCommand) {
          this.chaos.logger.warn('configureCommand is deprecated. Please use onListen');
          return toObservable(command.configureCommand()).map(() => command);
        } else {
          return Rx.Observable.of(command);
        }
      })
      .flatMap((command) => {
        if (command.onNixListen) {
          this.chaos.logger.warn('onNixListen is deprecated. Please use onListen');
          return toObservable(command.onNixListen());
        } else if (command.onListen) {
          return toObservable(command.onListen());
        } else {
          return Rx.Observable.of(command);
        }
      })
      .toArray()
      .map(() => true);
  }

  /**
   * Registers a new command
   *
   * @param command {Object} options for command
   */
  addCommand(command) {
    command = new Command(this.chaos, command);

    if (this._commands[command.name.toLowerCase()]) {
      let error = new Error(`Command '${command.name}' has already been added.`);
      error.name = "CommandAlreadyAdded";
      throw(error);
    }

    this._commands[command.name.toLowerCase()] = command;
    this.chaos.logger.verbose(`Loaded command: ${command.name}`);
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
