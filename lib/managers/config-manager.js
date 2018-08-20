const ConfigAction = require("../models/config-action");

class ConfigManager {
  constructor(nix) {
    this._nix = nix;
    this._actions = {};

    //Bind methods for aliasing to NixCore
    this.addConfigAction = this.addConfigAction.bind(this);
    this.getConfigAction = this.getConfigAction.bind(this);
  }

  get nix() {
    return this._nix;
  }

  get actions() {
    // replace the keys with the case sensitive names
    return Object.values(this._actions);
  }

  addConfigAction(moduleName, action) {
    let actionKey = `${moduleName}.${action.name}`;

    if (this._actions[actionKey.toLowerCase()]) {
      let error = new Error(`The config action '${actionKey}' has already been added.`);
      error.name = "ConfigActionAlreadyExistsError";
      throw error;
    }

    this._actions[actionKey.toLowerCase()] = new ConfigAction(action);
    this.nix.logger.verbose(`Loaded config action: ${actionKey}`);
  }

  getConfigAction(moduleName, actionName) {
    let actionKey = `${moduleName}.${actionName}`;

    if (!this._actions[actionKey.toLowerCase()]) {
      let error = new Error(`The config action '${actionKey}' could not be found.`);
      error.name = "ConfigActionNotFoundError";
      throw error;
    }

    return this._actions[actionKey.toLowerCase()];
  }
}

module.exports = ConfigManager;
