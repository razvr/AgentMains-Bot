const Rx = require('rx');
const DataKeys = require('../datakeys');
const Service = require('../../models/service');


class PluginService extends Service {
  constructor(chaos) {
    super(chaos);

    this._pluginManager = this.chaos.pluginManager;
    this.getPlugin = this._pluginManager.getPlugin;
  }

  get plugins() {
    return this._pluginManager.plugins;
  }

  onJoinGuild(guild) {
    return Rx.Observable.from(this.plugins)
      .flatMap((plugin) =>
        this.isPluginEnabled(guild.id, plugin.name)
          .filter(Boolean)
          .flatMap(() => {
            if (typeof plugin.onEnabled === 'undefined') { return Rx.Observable.of(true); }
            return plugin.onEnabled(guild.id);
          }),
      )
      .toArray()
      .map(true);
  }

  enablePlugin(guildId, pluginName) {
    let plugin = this.getPlugin(pluginName);

    return this.isPluginEnabled(guildId, plugin.name)
      .flatMap((isEnabled) => {
        if (isEnabled) {
          let error = new Error(`Plugin ${plugin.name} is already enabled.`);
          error.name = "PluginError";
          return Rx.Observable.throw(error);
        }
        return this.chaos.getGuildData(guildId, DataKeys.ENABLED_PLUGINS);
      })
      .flatMap((savedData) => {
        if (plugin.onEnabled) {
          let guild = this.chaos.discord.guilds.get(guildId);
          return Rx.Observable.of().flatMap(() => plugin.onEnabled(guild)).map(savedData);
        } else {
          return Rx.Observable.of(savedData);
        }
      })
      .do((savedData) => savedData[plugin.name] = true)
      .flatMap((savedData) => this.chaos.setGuildData(guildId, DataKeys.ENABLED_PLUGINS, savedData))
      .flatMap((savedData) => Rx.Observable.return(savedData[plugin.name]))
      .map(true);
  }

  disablePlugin(guildId, pluginName) {
    let plugin = this.getPlugin(pluginName);

    return this.isPluginEnabled(guildId, plugin.name)
      .flatMap((isEnabled) => {
        if (!isEnabled) {
          let error = new Error(`Plugin ${plugin.name} is already disabled.`);
          error.name = "PluginError";
          return Rx.Observable.throw(error);
        }
        return this.chaos.getGuildData(guildId, DataKeys.ENABLED_PLUGINS);
      })
      .flatMap((savedData) => {
        if (plugin.onDisabled) {
          let guild = this.chaos.discord.guilds.get(guildId);
          return Rx.Observable.of().flatMap(() => plugin.onDisabled(guild)).map(savedData);
        } else {
          return Rx.Observable.of(savedData);
        }
      })
      .do((savedData) => savedData[plugin.name] = false)
      .flatMap((savedData) => this.chaos.setGuildData(guildId, DataKeys.ENABLED_PLUGINS, savedData))
      .flatMap((savedData) => Rx.Observable.return(savedData[plugin.name]))
      .map(true);
  }

  isPluginEnabled(guildId, pluginName) {
    let plugin = this.chaos.getPlugin(pluginName);

    if (plugin.name === "core") {
      // Core plugin is always enabled
      return Rx.Observable.of(true);
    }

    return this.chaos.getGuildData(guildId, DataKeys.ENABLED_PLUGINS)
      .map((savedData) => savedData[plugin.name])
      .map((isEnabled) => {
        if (typeof isEnabled === 'undefined') {
          return plugin.enabledByDefault;
        }
        return isEnabled;
      });
  }

  filterPluginEnabled(guildId, pluginName) {
    return this.isPluginEnabled(guildId, pluginName)
      .filter(Boolean);
  }
}

module.exports = PluginService;
