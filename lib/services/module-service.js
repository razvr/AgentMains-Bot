const Rx = require('rx');

const Module = require('../models/module');

class ModuleService {
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

    module.configActions.forEach((action) => {
      this.nix.configService.addAction(module.name, action);
    });

    module.commands.forEach((command) => {
      command.moduleName = module.name;
      this.nix.commandService.addCommand(command);
    });

    module.permissions.forEach((level) => {
      this.nix.permissionsService.addPermissionLevel(level);
    });
  }

  isModuleEnabled(guildId, moduleName) {
    let module = this.modules[moduleName];
    if (!module) {
      return Rx.Observable.return(false);
    }

    return this.nix.dataService
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
        return nix.dataService
          .getGuildData(guildId, defaultData.keyword)
          .flatMap((savedData) => {
            if (typeof savedData === 'undefined') {
              return nix.dataService.setGuildData(guildId, defaultData.keyword, defaultData.data);
            }
            else {
              return Rx.Observable.return(savedData);
            }
          });
      });
  }
}

module.exports = ModuleService;
