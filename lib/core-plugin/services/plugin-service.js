const { from, of, throwError } = require('rxjs');
const { flatMap, toArray, tap, mapTo, filter, map, defaultIfEmpty } = require('rxjs/operators');

const DataKeys = require('../datakeys');
const Service = require('../../models/service');
const { PluginError } = require("../../errors");
const { toObservable } = require("../../utility");

class PluginService extends Service {
  constructor(chaos) {
    super(chaos);

    this.getPlugin = this.chaos.pluginManager.getPlugin;

    this.chaos.on('guildCreate', (guild) => {
      return from(this.plugins).pipe(
        flatMap((plugin) => this.isPluginEnabled(guild.id, plugin.name).pipe(
          filter(Boolean),
          flatMap(() => this._hookOnEnabled(guild.id, plugin)),
        )),
        toArray(),
        mapTo(true),
      );
    });
  }

  get plugins() {
    return this.chaos.pluginManager.plugins;
  }

  enablePlugin(guildId, pluginName) {
    let plugin = this.getPlugin(pluginName);

    return this.isPluginEnabled(guildId, plugin.name).pipe(
      tap((isEnabled) => {
        if (isEnabled) {
          let error = new PluginError(`Plugin ${plugin.name} is already enabled.`);
          return throwError(error);
        }
      }),
      flatMap(() => this._getEnabledPlugins(guildId)),
      tap((savedData) => savedData[plugin.name] = true),
      flatMap((savedData) => this._setEnabledPlugins(guildId, savedData)),
      tap(() => this.chaos.logger.info(`enabled ${pluginName} plugin in ${guildId}`)),
      flatMap(() => this._hookOnEnabled(guildId, plugin)),
      mapTo(true),
    );
  }

  disablePlugin(guildId, pluginName) {
    let plugin = this.getPlugin(pluginName);

    return this.isPluginEnabled(guildId, plugin.name).pipe(
      tap((isEnabled) => {
        if (!isEnabled) {
          let error = new PluginError(`Plugin ${plugin.name} is already disabled.`);
          return throwError(error);
        }
      }),
      flatMap(() => this._getEnabledPlugins(guildId)),
      tap((savedData) => savedData[plugin.name] = false),
      flatMap((savedData) => this._setEnabledPlugins(guildId, savedData)),
      tap(() => this.chaos.logger.info(`disabled ${pluginName} plugin in ${guildId}`)),
      flatMap(() => this._hookOnDisabled(guildId, plugin)),
      mapTo(true),
    );
  }

  isPluginEnabled(guildId, pluginName) {
    let plugin = this.chaos.getPlugin(pluginName);

    if (plugin.name === "core") {
      // Core plugin is always enabled
      return of(true).pipe(
        tap((enabled) => this.chaos.logger.debug(`is plugin core enabled in ${guildId}: ${enabled}`)),
      );
    }

    return of('').pipe(
      flatMap(() => this._getEnabledPlugins(guildId)),
      map((savedData) => savedData[plugin.name]),
      map(Boolean),
      tap((enabled) => this.chaos.logger.debug(`is plugin ${pluginName} enabled in ${guildId}: ${enabled}`)),
    );
  }

  filterPluginEnabled(guildId, pluginName) {
    return this.isPluginEnabled(guildId, pluginName).pipe(
      tap(() => this.chaos.logger.warn('filterPluginEnabled is deprecated. use #isPluginEnabled instead.')),
      filter(Boolean),
    );
  }

  async _getEnabledPlugins(guildId) {
    let data = await this.getGuildData(guildId, DataKeys.ENABLED_PLUGINS);
    return data ? data : {};
  }

  async _setEnabledPlugins(guildId, enabledPlugins) {
    await this.setGuildData(guildId, DataKeys.ENABLED_PLUGINS, enabledPlugins);
    return this._getEnabledPlugins(guildId);
  }

  _hookOnEnabled(guildId, plugin) {
    return of('').pipe(
      filter(() => plugin.onEnabled),
      flatMap(() => {
        const guild = this.chaos.discord.guilds.get(guildId);
        return toObservable(plugin.onEnabled(guild));
      }),
      defaultIfEmpty(''),
    );
  }

  _hookOnDisabled(guildId, plugin) {
    return of('').pipe(
      filter(() => plugin.onDisabled),
      flatMap(() => {
        const guild = this.chaos.discord.guilds.get(guildId);
        return toObservable(plugin.onDisabled(guild));
      }),
      defaultIfEmpty(''),
    );
  }
}

module.exports = PluginService;
