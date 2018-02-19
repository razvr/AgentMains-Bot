class ConfigActionService {
  constructor(nix) {
    this.nix = nix;
    this._actions = {};
  }

  addAction(moduleName, action) {
    this.nix.logger.info(`adding config action: ${moduleName}:${action.name}`);

    let moduleNameKey = moduleName.toLowerCase();
    if (!this._actions[moduleNameKey]) {
      this._actions[moduleNameKey] = {
        name: moduleName,
        actions: {},
      };
    }

    let actionNameKey = action.name.toLowerCase();
    this._actions[moduleNameKey].actions[actionNameKey] = action;
  }

  getAction(moduleName, actionName) {
    let moduleNameKey = moduleName.toLowerCase();
    let actionNameKey = actionName.toLowerCase();

    if (!this._actions[moduleNameKey]) {
      return undefined;
    }

    return this._actions[moduleNameKey].actions[actionNameKey];
  }

}

module.exports = ConfigActionService;
