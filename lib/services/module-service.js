const Rx = require('rx');

const Module = require('../models/module');

const ERRORS = {
  MODULE_NOT_FOUND: 'Module does not exist',
  MODULE_ALREADY_ENABLED: 'Module is already enabled',
  MODULE_ALREADY_DISABLED: 'Module is already disabled',
};

const DATAKEYS = {
  ENABLED_MODULES: 'core.enabledModules',
};

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

  getModule(moduleName) {
    let module = this.modules[moduleName.toLowerCase()];
    if (!module) { throw new Error(ERRORS.MODULE_NOT_FOUND); }
    return module;
  }

  addModule(module) {
    module = new Module(module);
    this.modules[module.name.toLowerCase()] = module;

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

  onNixListen() {
    return Rx.Observable
      .from(Object.values(this.modules))
      .flatMap((module) => {
        if (typeof module.onNixListen === 'undefined') { return Rx.Observable.of(true); }
        return module.onNixListen();
      })
      .map(true);
  }

  enableModule(guildId, moduleName) {
    let module = this.getModule(moduleName);

    return this.isModuleEnabled(guildId, module.name)
      .flatMap((isEnabled) => {
        if (isEnabled) { return Rx.Observable.throw(new Error(ERRORS.MODULE_ALREADY_ENABLED)); }
        return this.nix.dataService.getGuildData(guildId, DATAKEYS.ENABLED_MODULES);
      })
      .flatMap((savedData) => {
        savedData[module.name] = true;
        return this.nix.dataService.setGuildData(guildId, DATAKEYS.ENABLED_MODULES, savedData);
      })
      .flatMap((savedData) => Rx.Observable.return(savedData[module.name]));
  }

  disableModule(guildId, moduleName) {
    let module = this.getModule(moduleName);

    return this.isModuleEnabled(guildId, module.name)
      .flatMap((isEnabled) => {
        if (!isEnabled) { return Rx.Observable.throw(new Error(ERRORS.MODULE_ALREADY_DISABLED)); }
        return this.nix.dataService.getGuildData(guildId, DATAKEYS.ENABLED_MODULES);
      })
      .flatMap((savedData) => {
        savedData[module.name] = false;
        return this.nix.dataService.setGuildData(guildId, DATAKEYS.ENABLED_MODULES, savedData);
      })
      .flatMap((savedData) => Rx.Observable.return(savedData[module.name]));
  }

  isModuleEnabled(guildId, moduleName) {
    let module = this.getModule(moduleName);

    return this.nix.dataService
      .getGuildData(guildId, DATAKEYS.ENABLED_MODULES)
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

ModuleService.ERRORS = ERRORS;
ModuleService.DATAKEYS = DATAKEYS;

module.exports = ModuleService;
