const { from } = require('rxjs');
const { tap, flatMap, map, toArray, filter } = require('rxjs/operators');

const ConfigAction = require("../models/config-action");
const { toObservable } = require("../utility");

class ConfigManager {
  constructor(chaos) {
    this._chaos = chaos;
    this._actions = {};

    //Bind methods for aliasing to ChaosCore
    this.addConfigAction = this.addConfigAction.bind(this);
    this.getConfigAction = this.getConfigAction.bind(this);

    this.chaos.on('chaos.listen', () => this.onChaosListen());
  }

  get chaos() {
    return this._chaos;
  }

  get actions() {
    // replace the keys with the case sensitive names
    return Object.values(this._actions);
  }

  onChaosListen() {
    return from(this.actions).pipe(
      filter((configAction) => configAction.onListen),
      tap(() => this.chaos.logger.warn(`onListen is deprecated. Please use chaos.on('chaos.listen', () => {}) instead`)),
      tap((configAction) => this.chaos.logger.verbose(`onListen configAction: ${configAction.pluginName}/${configAction.name}`)),
      flatMap((configAction) => toObservable(configAction.onListen())),
      toArray(),
      map(() => true),
    );
  }

  addConfigAction(pluginName, action) {
    if (action instanceof ConfigAction) {
      if (action.chaos !== this.chaos) {
        throw TypeError("ConfigAction is bound to a different instance of ChaosCore.");
      }
    } else if (action.prototype instanceof ConfigAction) {
      action = new action(this.chaos);
    } else {
      action = new ConfigAction(this.chaos, action);
    }

    action.pluginName = pluginName;
    action.validate();

    const actionKey = `${pluginName}.${action.name}`;
    if (this._actions[actionKey.toLowerCase()]) {
      let error = new Error(`The config action '${actionKey}' has already been added.`);
      error.name = "ConfigActionAlreadyExistsError";
      throw error;
    }

    this._actions[actionKey.toLowerCase()] = action;
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
