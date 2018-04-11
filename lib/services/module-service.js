const Rx = require('rx');

const Module = require('../models/module');
const Service = require('../models/service');

const ERRORS = {
  MODULE_NOT_FOUND: 'Module does not exist',
  MODULE_ALREADY_ENABLED: 'Module is already enabled',
  MODULE_ALREADY_DISABLED: 'Module is already disabled',
};

const DATAKEYS = {
  ENABLED_MODULES: 'core.enabledModules',
};

class ModuleService extends Service {
  constructor(nix) {
    super(nix);

    this._modules = {};
  }

  get modules() {
    return this._modules;
  }

  configureService() {
    this.dataService = this.nix.getService('core', 'dataService');
  }

  onNixListen() {
    return Rx.Observable.from(this.nix.moduleManager.modules)
      .flatMap((module) => {
        if (typeof module.onNixListen === 'undefined') { return Rx.Observable.of(true); }
        return module.onNixListen();
      })
      .toArray()
      .map(true);
  }

  onNixJoinGuild(guild) {
    return Rx.Observable.from(this.nix.moduleManager.modules)
      .flatMap((module) =>
        this.isModuleEnabled(guild.id, module.name)
          .filter(Boolean)
          .flatMap(() => {
            if (typeof module.onEnabled === 'undefined') { return Rx.Observable.of(true); }
            return module.onEnabled(guild.id);
          })
      )
      .toArray()
      .map(true);
  }

  enableModule(guildId, moduleName) {
    let module = this.getModule(moduleName);

    return this.isModuleEnabled(guildId, module.name)
      .flatMap((isEnabled) => {
        if (isEnabled) { return Rx.Observable.throw(new Error(ERRORS.MODULE_ALREADY_ENABLED)); }
        return this.dataService.getGuildData(guildId, DATAKEYS.ENABLED_MODULES);
      })
      .flatMap((savedData) => {
        if (typeof module.onEnabled === 'undefined') { return Rx.Observable.of(savedData); }
        return Rx.Observable.of().flatMap(() => module.onEnabled(guildId)).map(savedData);
      })
      .do((savedData) => savedData[module.name] = true)
      .flatMap((savedData) => this.dataService.setGuildData(guildId, DATAKEYS.ENABLED_MODULES, savedData))
      .flatMap((savedData) => Rx.Observable.return(savedData[module.name]))
      .map(true);
  }

  disableModule(guildId, moduleName) {
    let module = this.getModule(moduleName);

    if (!module.canBeDisabled) {
      let error = new Error();
      error.name = "ModuleCanNotBeDisabled";
      error.message =
        `the module '${module.name}' can not be disabled because it's canBeDisabled property is set to false`;
      return Rx.Observable.throw(error);
    }

    return this.isModuleEnabled(guildId, module.name)
      .flatMap((isEnabled) => {
        if (!isEnabled) { return Rx.Observable.throw(new Error(ERRORS.MODULE_ALREADY_DISABLED)); }
        return this.dataService.getGuildData(guildId, DATAKEYS.ENABLED_MODULES);
      })
      .flatMap((savedData) => {
        if (typeof module.onDisabled === 'undefined') { return Rx.Observable.of(savedData); }
        return Rx.Observable.of().flatMap(() => module.onDisabled(guildId)).map(savedData);
      })
      .do((savedData) => savedData[module.name] = false)
      .flatMap((savedData) => this.dataService.setGuildData(guildId, DATAKEYS.ENABLED_MODULES, savedData))
      .flatMap((savedData) => Rx.Observable.return(savedData[module.name]))
      .map(true);
  }

  isModuleEnabled(guildId, moduleName) {
    let module = this.nix.getModule(moduleName);

    if (!module.canBeDisabled) {
      // Can't be disabled, so it's always enabled
      return Rx.Observable.of(true);
    }

    return this.dataService
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
        return this.dataService
          .getGuildData(guildId, defaultData.keyword)
          .flatMap((savedData) => {
            if (typeof savedData === 'undefined') {
              return this.dataService.setGuildData(guildId, defaultData.keyword, defaultData.data);
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
