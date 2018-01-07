class ConfigActionService {
  constructor(nix) {
    this.nix = nix;
    this._actions = {};
  }

  addAction(moduleName, action) {
    this.nix.logger.info(`adding config action: ${moduleName}:${action.name}`);
    let key = getActionKey(moduleName, action.name);
    this._actions[key] = action;
  }

  getAction(moduleName, actionName) {
    let key = getActionKey(moduleName, actionName);
    return this._actions[key];
  }

  getActionList() {
    let list = {};

    Object.keys(this._actions).forEach((actionKey) => {
      let moduleName = actionKey.split(':')[0];
      if(!list[moduleName]) { list[moduleName] = []; }
      list[moduleName].push(this._actions[actionKey]);
    });

    return list;
  }
}

function getActionKey(moduleName, actionName) {
  return moduleName.toLowerCase() + ':' + actionName.toLowerCase();
}

module.exports = ConfigActionService;
