const { from, of } = require('rxjs');
const { flatMap, mapTo, filter } = require('rxjs/operators');

const ChaosManager = require('../models/chaos-manager');
const Plugin = require('../models/plugin');
const { PluginNotFoundError } = require("../errors");
const { PluginAlreadyExistsError } = require("../errors");

class PluginManager extends ChaosManager {
  constructor(chaos) {
    super(chaos);
    this._plugins = {};

    //Bind methods for aliasing to ChaosCore
    this.addPlugin = this.addPlugin.bind(this);
    this.getPlugin = this.getPlugin.bind(this);

    this.chaos.on('guildCreate', (guild) => this.onGuildCreate(guild));
  }

  get plugins() {
    // replace the keys with the case sensitive names
    return Object.values(this._plugins);
  }

  getPlugin(pluginName) {
    let plugin = this._plugins[pluginName.toLowerCase()];

    if (!plugin) {
      throw new PluginNotFoundError(`Plugin '${pluginName}' could not be found. Has it been added to the bot?`);
    }

    return plugin;
  }

  addPlugin(plugin) {
    if (plugin instanceof Plugin) {
      if (plugin.chaos !== this.chaos) {
        throw TypeError("Plugin is bound to a different instance of ChaosCore.");
      }
    } else if (plugin.prototype instanceof Plugin) {
      plugin = new plugin(this.chaos);
    } else {
      plugin = new Plugin(this.chaos, plugin);
    }

    if (this._plugins[plugin.name.toLowerCase()]) {
      throw new PluginAlreadyExistsError(`Plugin '${plugin.name}' has already been added.`);
    }

    plugin.validate();

    plugin.dependencies.forEach((plugin) => this.addPlugin(plugin));

    this.chaos.logger.verbose(`Loading plugin: ${plugin.name}`);
    this._plugins[plugin.name.toLowerCase()] = plugin;
    this.chaos.applyStrings(plugin.strings);

    plugin.services.forEach((Service) => {
      this.chaos.addService(plugin.name, Service);
    });

    plugin.configActions.forEach((action) => {
      this.chaos.addConfigAction(plugin.name, action);
    });

    plugin.commands.forEach((command) => {
      this.chaos.addCommand(plugin.name, command);
    });

    plugin.permissions.forEach((level) => {
      this.chaos.addPermissionLevel(level);
    });

    this.chaos.logger.info(`Loaded plugin: ${plugin.name}`);
  }

  onGuildCreate(guild) {
    return of('').pipe(
      flatMap(() => from(this.plugins).pipe(
        this._prepareDataForGuild(guild),
      )),
      mapTo(true),
    );
  }

  _prepareDataForGuild(guild) {
    return flatMap((plugin) => from(plugin.defaultData).pipe(
      flatMap((defaultData) => this.chaos.getGuildData(guild.id, defaultData.keyword).pipe(
        filter((savedData) => typeof savedData === 'undefined'),
        flatMap(() => this.chaos.setGuildData(guild.id, defaultData.keyword, defaultData.data)),
      )),
    ));
  }
}

module.exports = PluginManager;
