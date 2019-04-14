const Rx = require('rx');

const Service = require('../../models/service');

const DATAKEYS = {
  ENABLED_MODULES: 'core.enabledPlugins',
};

class PluginService extends Service {
  constructor(nix) {
    super(nix);

    this._pluginManager = this.chaos.pluginManager;
    this.getPlugin = this._pluginManager.getPlugin;
  }

  get plugins() {
    return this._pluginManager.plugins;
  }

  onJoinGuild(guild) {
    return Rx.Observable.from(this.plugins)
      .flatMap((module) =>
        this.isPluginEnabled(guild.id, module.name)
          .filter(Boolean)
          .flatMap(() => {
            if (typeof module.onEnabled === 'undefined') { return Rx.Observable.of(true); }
            return module.onEnabled(guild.id);
          }),
      )
      .toArray()
      .map(true);
  }

  enablePlugin(guildId, pluginName) {
    let module = this.getPlugin(pluginName);

    return this.isPluginEnabled(guildId, module.name)
      .flatMap((isEnabled) => {
        if (isEnabled) {
          let error = new Error(`Plugin ${module.name} is already enabled.`);
          error.name = "PluginError";
          return Rx.Observable.throw(error);
        }
        return this.chaos.getGuildData(guildId, DATAKEYS.ENABLED_MODULES);
      })
      .flatMap((savedData) => {
        if (module.onEnabled) {
          let guild = this.chaos.discord.guilds.get(guildId);
          return Rx.Observable.of().flatMap(() => module.onEnabled(guild)).map(savedData);
        } else {
          return Rx.Observable.of(savedData);
        }
      })
      .do((savedData) => savedData[module.name] = true)
      .flatMap((savedData) => this.chaos.setGuildData(guildId, DATAKEYS.ENABLED_MODULES, savedData))
      .flatMap((savedData) => Rx.Observable.return(savedData[module.name]))
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
        return this.chaos.getGuildData(guildId, DATAKEYS.ENABLED_MODULES);
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
      .flatMap((savedData) => this.chaos.setGuildData(guildId, DATAKEYS.ENABLED_MODULES, savedData))
      .flatMap((savedData) => Rx.Observable.return(savedData[plugin.name]))
      .map(true);
  }

  isPluginEnabled(guildId, pluginName) {
    let plugin = this.chaos.getPlugin(pluginName);

    if (plugin.name === "core") {
      // Core plugin is always enabled
      return Rx.Observable.of(true);
    }

    return this.chaos.getGuildData(guildId, DATAKEYS.ENABLED_MODULES)
      .map((savedData) => savedData[plugin.name])
      .map((isEnabled) => {
        if (typeof isEnabled === 'undefined') {
          return plugin.enabledByDefault;
        }
        return isEnabled;
      });
  }

  prepareDefaultData(nix, guildId) {
    return Rx.Observable
      .from(Object.values(this.plugins))
      .flatMap((module) => Rx.Observable.from(module.defaultData))
      .flatMap((defaultData) => {
        return this.chaos.getGuildData(guildId, defaultData.keyword)
          .flatMap((savedData) => {
            if (typeof savedData === 'undefined') {
              return this.chaos.setGuildData(guildId, defaultData.keyword, defaultData.data);
            }
            else {
              return Rx.Observable.return(savedData);
            }
          });
      })
      .defaultIfEmpty('')
      .last();
  }

  filterPluginEnabled(guildId, pluginName) {
    return this.isPluginEnabled(guildId, pluginName)
      .filter(Boolean);
  }
}

PluginService.DATAKEYS = DATAKEYS;

module.exports = PluginService;
