const Rx = require('rx');
const ConfigAction = require("../models/config-action");
const { toObservable } = require("../utility");

class ConfigManager {
  constructor(chaos) {
    this._chaos = chaos;
    this._actions = {};

    //Bind methods for aliasing to NixCore
    this.addConfigAction = this.addConfigAction.bind(this);
    this.getConfigAction = this.getConfigAction.bind(this);
  }

  get chaos() {
    return this._chaos;
  }

  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  get actions() {
    // replace the keys with the case sensitive names
    return Object.values(this._actions);
  }

  onListen() {
    return Rx.Observable.from(this.actions)
      .do((configAction) => this.chaos.logger.debug(`onListen configAction: ${configAction.pluginName}/${configAction.name}`))
      .flatMap((configAction) => {
        if (configAction.configureCommand) {
          this.chaos.logger.warn('configureAction is deprecated. Please use onListen');
          return toObservable(configAction.configureAction()).map(() => configAction);
        } else {
          return Rx.Observable.of(configAction);
        }
      })
      .flatMap((configAction) => {
        if (configAction.onNixListen) {
          this.chaos.logger.warn('onNixListen is deprecated. Please use onListen');
          return toObservable(configAction.onNixListen());
        } else if (configAction.onListen) {
          return toObservable(configAction.onListen());
        } else {
          return Rx.Observable.of(configAction);
        }
      })
      .toArray()
      .map(() => true);
  }

  addConfigAction(pluginName, action) {
    let actionKey = `${pluginName}.${action.name}`;

    if (this._actions[actionKey.toLowerCase()]) {
      let error = new Error(`The config action '${actionKey}' has already been added.`);
      error.name = "ConfigActionAlreadyExistsError";
      throw error;
    }

    action.chaos = this.chaos;
    action.pluginName = pluginName;

    this._actions[actionKey.toLowerCase()] = new ConfigAction(action);
    this.chaos.logger.verbose(`Loaded config action: ${actionKey}`);
  }

  getConfigAction(pluginName, actionName) {
    let actionKey = `${pluginName}.${actionName}`;

    if (!this._actions[actionKey.toLowerCase()]) {
      let error = new Error(`The config action '${actionKey}' could not be found.`);
      error.name = "ConfigActionNotFoundError";
      throw error;
    }

    return this._actions[actionKey.toLowerCase()];
  }
}

module.exports = ConfigManager;
