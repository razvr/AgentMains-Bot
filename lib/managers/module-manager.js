const fs = require('fs');
const Rx = require('rx');

const Module = require('../models/module');
const { toObservable } = require("../utility");

class ModuleManager {
  get nix() {
    return this._nix;
  }

  get modules() {
    // replace the keys with the case sensitive names
    return Object.values(this._modules);
  }

  constructor(nix) {
    this._nix = nix;
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
    this.nix.logger.verbose(`Loaded module: ${module.name}`);

    module.services.forEach((Service) => {
      this.nix.addService(module.name, Service);
    });

    module.configActions.forEach((action) => {
      this.nix.addConfigAction(module.name, action);
    });

    module.commands.forEach((command) => {
      command.moduleName = module.name;
      this.nix.addCommand(command);
    });

    module.permissions.forEach((level) => {
      this.nix.addPermissionLevel(level);
    });
  }

  onNixListen() {
    return Rx.Observable.from(this.modules)
      .filter((module) => module.onNixListen)
      .flatMap((module) => toObservable(module.onNixListen()))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }

  onNixJoinGuild(guild) {
    return Rx.Observable.from(this.modules)
      .filter((module) => module.onNixJoinGuild)
      .flatMap((module) => toObservable(module.onNixJoinGuild(guild)))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }
}

module.exports = ModuleManager;
