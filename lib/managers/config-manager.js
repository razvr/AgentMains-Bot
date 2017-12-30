class ConfigManager {
  constructor(nix) {
    this.nix = nix;
    this._actions = {};
  }

  addAction(moduleName, actionName, action) {
    let key = getActionKey(moduleName, actionName);
    this._actions[key] = action;
  }

  getAction(moduleName, actionName) {
    let key = getActionKey(moduleName, actionName);
    return this._actions[key];
  }

  getActionList() {
    let list = {};

    Object.keys(this._actions).forEach((actionKey) => {
      let [module, action] = actionKey.split(':');
      if(!list[module]) { list[module] = []; }
      list[module].push(action);
    });

    return list;
  }
}

function getActionKey(moduleName, actionName) {
  return moduleName + ':' + actionName;
}

module.exports = ConfigManager;
