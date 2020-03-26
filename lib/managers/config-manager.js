const ChaosManager = require('../models/chaos-manager');
const ConfigAction = require("../models/config-action");
const { ConfigActionNotFoundError } = require("../errors");
const { ConfigActionAlreadyExistsError } = require("../errors");

class ConfigManager extends ChaosManager {
  constructor(chaos) {
    super(chaos);
    this._actions = {};

    //Bind methods for aliasing to ChaosCore
    this.addConfigAction = this.addConfigAction.bind(this);
    this.getConfigAction = this.getConfigAction.bind(this);
  }

  get actions() {
    // replace the keys with the case sensitive names
    return Object.values(this._actions);
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
      throw new ConfigActionAlreadyExistsError(`The config action '${actionKey}' has already been added.`);
    }

    this._actions[actionKey.toLowerCase()] = action;
    this.chaos.logger.verbose(`Loaded config action: ${actionKey}`);
  }

  getConfigAction(pluginName, actionName) {
    let actionKey = `${pluginName}.${actionName}`;

    if (!this._actions[actionKey.toLowerCase()]) {
      throw new ConfigActionNotFoundError(`The config action '${actionKey}' could not be found.`);
    }

    return this._actions[actionKey.toLowerCase()];
  }
}

module.exports = ConfigManager;
