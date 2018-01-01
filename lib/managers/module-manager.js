const Rx = require('rx');

const Module = require('../models/module');

class ModuleManager {
  constructor(nix, modules = []) {
    this._modules = {};
    this.nix = nix;

    modules.forEach((module) => {
      this.addModule(module);
    });
  }

  get modules() {
    return this._modules;
  }

  addModule(module) {
    module = new Module(module);
    this.modules[module.name] = module;

    let configMan = this.nix.configManager;
    module.configActions.forEach((action) => {
      configMan.addAction(module.name, action);
    });

    let cmdMan = this.nix.commandManager;
    module.commands.forEach((command) => {
      command.moduleName = module.name;
      cmdMan.addCommand(command);
    });

    let permsMan = this.nix.permissionsManager;
    module.permissions.forEach((level) => {
      permsMan.addPermissionLevel(level);
    });
  }

  isModuleEnabled(guildId, moduleName) {
    let module = this.modules[moduleName];
    if (!module) {
      return Rx.Observable.return(false);
    }

    return this.nix.data
      .getGuildData(guildId, 'core.enabledModules')
      .map((savedData) => savedData[module.name])
      .map((isEnabled) => {
        if (typeof isEnabled === 'undefined') {
          return module.enabledByDefault;
        }
        return isEnabled;
      });
  }

  prepareDefaultData(nix, guildId) {
    return Rx.Observable
      .from(Object.values(this.modules))
      .flatMap((module) => Rx.Observable.from(module.defaultData))
      .concatMap((defaultData) => { //concatMap, so that each value is saved in sequence not in parallel
        return nix.data
          .getGuildData(guildId, defaultData.keyword)
          .flatMap((savedData) => {
            if (typeof savedData === 'undefined') {
              return nix.data.setGuildData(guildId, defaultData.keyword, defaultData.data);
            }
            else {
              return Rx.Observable.return(savedData);
            }
          });
      });
  }
}

module.exports = ModuleManager;
