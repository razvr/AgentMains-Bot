const ConfigAction = require("../../index").ConfigAction;

class ConfigManager {
  get nix() {
    return this._nix;
  }

  get actions() {
    // replace the keys with the case sensitive names
    return Object.values(this._actions);
  }

  constructor(nix) {
    this._nix = nix;
    this._actions = {};

    //Bind methods for aliasing to NixCore
    this.addConfigAction = this.addConfigAction.bind(this);
    this.getConfigAction = this.getConfigAction.bind(this);
  }

  addConfigAction(moduleName, action) {
    let actionKey = `${moduleName}.${action.name}`.toLowerCase();
    this.nix.logger.verbose(`Loaded config action: ${actionKey}`);
    this._actions[actionKey] = new ConfigAction(action);
  }

  getConfigAction(moduleName, actionName) {
    let actionKey = `${moduleName}.${actionName}`.toLowerCase();
    return this._actions[actionKey];
  }
}

module.exports = ConfigManager;
