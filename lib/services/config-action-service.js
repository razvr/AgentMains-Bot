const Service = require('../models/service');
const ConfigAction = require('../models/config-action');

class ConfigActionService extends Service {
  constructor(nix) {
    super(nix);

    this._actions = {};
  }

  configureService() {
    this._injectServices();
  }

  _injectServices() {
    Object.entries(this._actions).forEach(([actionKey, action]) => {
      Object.entries(action.services).forEach(([serviceModule, services]) => {
        services.forEach((serviceName) => {
          this.nix.logger.silly(`injecting service '${serviceModule + '.' + serviceName}' into config action '${actionKey}'`);
          action[serviceName] = this.nix.getService(serviceModule, serviceName);
        });
      });
    });
  }

  addAction(moduleName, action) {
    let actionKey = `${moduleName}.${action.name}`.toLowerCase();
    this.nix.logger.debug(`adding config action: ${actionKey}`);
    this._actions[actionKey] = new ConfigAction(action);
  }

  getAction(moduleName, actionName) {
    let actionKey = `${moduleName}.${actionName}`.toLowerCase();
    return this._actions[actionKey];
  }
}

module.exports = ConfigActionService;
