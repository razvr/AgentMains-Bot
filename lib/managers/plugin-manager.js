const Rx = require('rx');

const Plugin = require('../models/plugin');
const { toObservable } = require("../utility");

class PluginManager {
  constructor(chaos) {
    this._chaos = chaos;
    this._plugins = {};

    //Bind methods for aliasing to NixCore
    this.addPlugin = this.addPlugin.bind(this);
    this.getPlugin = this.getPlugin.bind(this);
  }

  get chaos() {
    return this._chaos;
  }

  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  get plugins() {
    // replace the keys with the case sensitive names
    return Object.values(this._plugins);
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

  onListen() {
    return Rx.Observable.from(this.plugins)
      .flatMap((plugin) => {
        if (plugin.onNixListen) {
          this.chaos.logger.warn('onNixListen is deprecated. Please use onListen');
          return toObservable(plugin.onNixListen());
        } else if (plugin.onListen) {
          return toObservable(plugin.onListen());
        } else {
          return Rx.Observable.empty();
        }
      })
      .toArray()
      .map(() => true);
  }

  onJoinGuild(guild) {
    return Rx.Observable.from(this.plugins)
      .flatMap((plugin) => {
        if (plugin.onNixJoinGuild) {
          this.chaos.logger.warn('onNixJoinGuild is deprecated. Please use onJoinGuild');
          return toObservable(plugin.onNixJoinGuild(guild));
        } else if (plugin.onJoinGuild) {
          return toObservable(plugin.onJoinGuild(guild));
        } else {
          return Rx.Observable.empty();
        }
      })
      .toArray()
      .map(() => true);
  }
}

module.exports = PluginManager;
