const fs = require('fs');
const Rx = require('rx');

const Plugin = require('../models/plugin');
const { toObservable } = require("../utility");

class PluginManager {
  get nix() {
    return this._nix;
  }

  get plugins() {
    // replace the keys with the case sensitive names
    return Object.values(this._plugins);
  }

  constructor(nix) {
    this._nix = nix;
    this._plugins = {};

    //Bind methods for aliasing to NixCore
    this.addPlugin = this.addPlugin.bind(this);
    this.getPlugin = this.getPlugin.bind(this);
  }

  loadPlugins() {
    fs.readdirSync(__dirname + '/../plugins')
      .map((file) => require(__dirname + '/../plugins/' + file))
      .map((module) => this.addPlugin(module));
  }

  getPlugin(pluginName) {
    let module = this._plugins[pluginName.toLowerCase()];
    if (!module) {
      let error = new Error(`Plugin '${pluginName}' could not be found. Has it been added to Nix?`);
      error.name = "PluginNotFoundError";
      throw error;
    }
    return module;
  }

  addPlugin(module) {
    module = new Plugin(module);
    if (this._plugins[module.name.toLowerCase()]) {
      let error = new Error(`Plugin '${module.name}' has already been added.`);
      error.name = "PluginAlreadyExistsError";
      throw error;
    }
    this._plugins[module.name.toLowerCase()] = module;
    this.nix.logger.verbose(`Loaded module: ${module.name}`);

    module.services.forEach((Service) => {
      this.nix.addService(module.name, Service);
    });

    module.configActions.forEach((action) => {
      this.nix.addConfigAction(module.name, action);
    });

    module.commands.forEach((command) => {
      command.pluginName = module.name;
      this.nix.addCommand(command);
    });

    module.permissions.forEach((level) => {
      this.nix.addPermissionLevel(level);
    });
  }

  onNixListen() {
    return Rx.Observable.from(this.plugins)
      .filter((module) => module.onNixListen)
      .flatMap((module) => toObservable(module.onNixListen()))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }

  onNixJoinGuild(guild) {
    return Rx.Observable.from(this.plugins)
      .filter((module) => module.onNixJoinGuild)
      .flatMap((module) => toObservable(module.onNixJoinGuild(guild)))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }
}

module.exports = PluginManager;
