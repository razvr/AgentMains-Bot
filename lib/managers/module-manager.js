const fs = require('fs');
const Rx = require('rx');

const Module = require('../models/module');
const { toObservable } = require("../utility");

class ModuleManager {
  get chaos() {
    return this._chaos;
  }

  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  get modules() {
    // replace the keys with the case sensitive names
    return Object.values(this._modules);
  }

  constructor(chaos) {
    this._chaos = chaos;
    this._modules = {};

    //Bind methods for aliasing to NixCore
    this.addModule = this.addModule.bind(this);
    this.getModule = this.getModule.bind(this);
  }

  loadModules() {
    fs.readdirSync(__dirname + '/../modules')
      .map((file) => require(__dirname + '/../modules/' + file))
      .map((module) => this.addModule(module));
  }

  getModule(moduleName) {
    let module = this._modules[moduleName.toLowerCase()];
    if (!module) {
      let error = new Error(`Module '${moduleName}' could not be found. Has it been added to Nix?`);
      error.name = "ModuleNotFoundError";
      throw error;
    }
    return module;
  }

  addModule(module) {
    module = new Module(module);
    if (this._modules[module.name.toLowerCase()]) {
      let error = new Error(`Module '${module.name}' has already been added.`);
      error.name = "ModuleAlreadyExistsError";
      throw error;
    }
    this._modules[module.name.toLowerCase()] = module;
    this.chaos.logger.verbose(`Loaded module: ${module.name}`);

    module.services.forEach((Service) => {
      this.chaos.addService(module.name, Service);
    });

    module.configActions.forEach((action) => {
      this.chaos.addConfigAction(module.name, action);
    });

    module.commands.forEach((command) => {
      command.moduleName = module.name;
      this.chaos.addCommand(command);
    });

    module.permissions.forEach((level) => {
      this.chaos.addPermissionLevel(level);
    });
  }

  onListen() {
    return Rx.Observable.from(this.modules)
      .flatMap((module) => {
        if (module.onNixListen) {
          this.chaos.logger.warn('onNixListen is deprecated. Please use onListen');
          return toObservable(module.onNixListen());
        } else if (module.onListen) {
          return toObservable(module.onListen());
        } else {
          return Rx.Observable.empty();
        }
      })
      .toArray()
      .map(() => true);
  }

  onJoinGuild(guild) {
    return Rx.Observable.from(this.modules)
      .flatMap((module) => {
        if (module.onNixJoinGuild) {
          this.chaos.logger.warn('onNixJoinGuild is deprecated. Please use onJoinGuild');
          return toObservable(module.onNixJoinGuild(guild));
        } else if (module.onJoinGuild) {
          return toObservable(module.onJoinGuild(guild));
        } else {
          return Rx.Observable.empty();
        }
      })
      .toArray()
      .map(() => true);
  }
}

module.exports = ModuleManager;
