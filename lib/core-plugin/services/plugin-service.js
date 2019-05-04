const { from, of, throwError } = require('rxjs');
const { flatMap, toArray, tap, mapTo, filter, map, defaultIfEmpty } = require('rxjs/operators');

const DataKeys = require('../datakeys');
const Service = require('../../models/service');
const { toObservable } = require("../../utility");

class PluginService extends Service {
  constructor(chaos) {
    super(chaos);

    this.getPlugin = this.chaos.pluginManager.getPlugin;
  }

  get plugins() {
    return this.chaos.pluginManager.plugins;
  }

  onJoinGuild(guild) {
    return from(this.plugins).pipe(
      flatMap((plugin) => this.isPluginEnabled(guild.id, plugin.name).pipe(
        filter(Boolean),
        flatMap(() => {
          if (typeof plugin.onEnabled === 'undefined') { return of(true); }
          return plugin.onEnabled(guild.id);
        }),
      )),
      toArray(),
      mapTo(true),
    );
  }

  enablePlugin(guildId, pluginName) {
    let plugin = this.getPlugin(pluginName);

    return this.isPluginEnabled(guildId, plugin.name).pipe(
      flatMap((isEnabled) => {
        if (isEnabled) {
          let error = new Error(`Plugin ${plugin.name} is already enabled.`);
          error.name = "PluginError";
          return throwError(error);
        }
        return this.chaos.getGuildData(guildId, DataKeys.ENABLED_PLUGINS);
      }),
      flatMap((savedData) => {
        if (plugin.onEnabled) {
          let guild = this.chaos.discord.guilds.get(guildId);
          return toObservable(plugin.onEnabled(guild)).pipe(mapTo(savedData));
        } else {
          return of(savedData);
        }
      }),
      tap((savedData) => savedData[plugin.name] = true),
      flatMap((savedData) => this.chaos.setGuildData(guildId, DataKeys.ENABLED_PLUGINS, savedData)),
      map((savedData) => savedData[plugin.name]),
      mapTo(true),
    );
  }

  disablePlugin(guildId, pluginName) {
    let plugin = this.getPlugin(pluginName);

    return this.isPluginEnabled(guildId, plugin.name).pipe(
      flatMap((isEnabled) => {
        if (!isEnabled) {
          let error = new Error(`Plugin ${plugin.name} is already disabled.`);
          error.name = "PluginError";
          return throwError(error);
        }
        return this.chaos.getGuildData(guildId, DataKeys.ENABLED_PLUGINS);
      }),
      flatMap((savedData) => {
        if (plugin.onDisabled) {
          let guild = this.chaos.discord.guilds.get(guildId);
          return toObservable(plugin.onDisabled(guild)).pipe(
            mapTo(savedData),
          );
        } else {
          return of(savedData);
        }
      }),
      tap((savedData) => savedData[plugin.name] = false),
      flatMap((savedData) => this.chaos.setGuildData(guildId, DataKeys.ENABLED_PLUGINS, savedData)),
      flatMap((savedData) => of(savedData[plugin.name])),
      mapTo(true),
    );
  }

  isPluginEnabled(guildId, pluginName) {
    let plugin = this.chaos.getPlugin(pluginName);

    if (plugin.name === "core") {
      // Core plugin is always enabled
      return of(true);
    }

    return this.chaos.getGuildData(guildId, DataKeys.ENABLED_PLUGINS).pipe(
      map((savedData) => savedData[plugin.name]),
      filter(Boolean),
      defaultIfEmpty(false),
    );
  }

  filterPluginEnabled(guildId, pluginName) {
    return this.isPluginEnabled(guildId, pluginName).pipe(
      filter(Boolean),
    );
  }
}

module.exports = PluginService;
