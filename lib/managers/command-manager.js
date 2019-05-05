const { from, of } = require('rxjs');
const { tap, flatMap, map, toArray } = require('rxjs/operators');

const Command = require('../models/command');
const { toObservable } = require("../utility");

class CommandManager {
  constructor(chaos) {
    this._chaos = chaos;
    this._commands = {};

    //Bind methods for aliasing to ChaosCore
    this.addCommand = this.addCommand.bind(this);
    this.getCommand = this.getCommand.bind(this);
  }

  get chaos() {
    return this._chaos;
  }

  get commands() {
    // replace the keys with the case sensitive names
    return Object.values(this._commands);
  }

  onListen() {
    return from(this.commands).pipe(
      tap((command) => this.chaos.logger.verbose(`onListen command: ${command.pluginName}/${command.name}`)),
      flatMap((command) => {
        if (command.onListen) {
          return toObservable(command.onListen());
        } else {
          return of(command);
        }
      }),
      toArray(),
      map(() => true),
    );
  }

  /**
   * Registers a new command
   *
   * @param command {Object} options for command
   */
  addCommand(command) {
    if (command instanceof Command) {
      if (command.chaos !== this.chaos) {
        throw TypeError("Command is bound to a different instance of ChaosCore.");
      }
    } else if (command.prototype instanceof Command) {
      command = new command(this.chaos);
    } else {
      command = new Command(this.chaos, command);
    }

    command.validate();

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
