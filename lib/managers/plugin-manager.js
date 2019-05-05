const { from, of } = require('rxjs');
const { flatMap, toArray, mapTo, filter } = require('rxjs/operators');

const Plugin = require('../models/plugin');
const { LoadPluginError } = require("../errors/plugin-manager-errors");
const { toObservable } = require("../utility");

class PluginManager {
  constructor(chaos) {
    this._chaos = chaos;
    this._plugins = {};

    //Bind methods for aliasing to ChaosCore
    this.addPlugin = this.addPlugin.bind(this);
    this.getPlugin = this.getPlugin.bind(this);
  }

  get chaos() {
    return this._chaos;
  }

  get plugins() {
    // replace the keys with the case sensitive names
    return Object.values(this._plugins);
  }

  getPlugin(pluginName) {
    let plugin = this._plugins[pluginName.toLowerCase()];

    if (!plugin) {
      let error = new Error(`Plugin '${pluginName}' could not be found. Has it been added to the bot?`);
      error.name = "PluginNotFoundError";
      throw error;
    }

    return plugin;
  }

  addPlugin(plugin) {
    if (typeof plugin === "string") {
      const npmPackageName = `chaos-plugin-${plugin}`;

      try {
        plugin = require(npmPackageName);
      } catch (error) {
        if (error.code === "MODULE_NOT_FOUND") {
          throw new LoadPluginError(`Unable to load plugin '${npmPackageName}'. Is the npm module '${npmPackageName}' installed?`);
        } else {
          throw error;
        }
      }
    }

    plugin = new Plugin(plugin);

    if (this._plugins[plugin.name.toLowerCase()]) {
      let error = new Error(`Plugin '${plugin.name}' has already been added.`);
      error.name = "PluginAlreadyExistsError";
      throw error;
    }

    if (plugin.dependencies.length > 0) {
      plugin.dependencies.forEach((plugin) => this.addPlugin(plugin));
    }

    plugin.bindChaos(this.chaos);
    this._plugins[plugin.name.toLowerCase()] = plugin;
    this.chaos.logger.verbose(`Loaded plugin: ${plugin.name}`);

    plugin.services.forEach((Service) => {
      this.chaos.addService(plugin.name, Service);
    });

    plugin.configActions.forEach((action) => {
      this.chaos.addConfigAction(plugin.name, action);
    });

    plugin.commands.forEach((command) => {
      command.pluginName = plugin.name;
      this.chaos.addCommand(command);
    });

    plugin.permissions.forEach((level) => {
      this.chaos.addPermissionLevel(level);
    });
  }

  onListen() {
    this.pluginService = this.chaos.getService('core', 'PluginService');

    return from(this.plugins).pipe(
      flatMap((plugin) => {
        if (plugin.onListen) {
          return toObservable(plugin.onListen()).pipe(mapTo(plugin));
        } else {
          return of(plugin);
        }
      }),
      flatMap((plugin) => from(this.chaos.discord.guilds.array()).pipe(
        flatMap((guild) => this.pluginService.isPluginEnabled(guild.id, plugin.name).pipe(
          filter(Boolean),
          mapTo(guild),
        )),
        flatMap((guild) => {
          if (plugin.onEnabled) {
            return toObservable(plugin.onEnabled(guild)).pipe(mapTo(guild));
          } else {
            return of(guild);
          }
        }),
      )),
      toArray(),
      mapTo(true),
    );
  }

  onJoinGuild(guild) {
    return from(this.plugins).pipe(
      flatMap((plugin) => toObservable(plugin.prepareData(guild)).pipe(
        mapTo(plugin),
      )),
      filter((plugin) => plugin.onJoinGuild),
      flatMap((plugin) => toObservable(plugin.onJoinGuild(guild))),
      toArray(),
      mapTo(true),
    );
  }
}

module.exports = PluginManager;