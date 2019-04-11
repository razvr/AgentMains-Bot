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

  configureActions() {
    return Rx.Observable.from(this.actions)
      .do((configAction) => this.chaos.logger.debug(`Configure config action: ${configAction.pluginName}/${configAction.name}`))
      .filter((configAction) => configAction.configureAction)
      .flatMap((configAction) => toObservable(configAction.configureAction()))
      .defaultIfEmpty('')
      .last()
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
