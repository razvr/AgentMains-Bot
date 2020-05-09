const ChaosComponent = require('./chaos-component');

class Plugin extends ChaosComponent {
  name = 'Name';
  description = null;

  dependencies = [];

  defaultData = [];

  permissionLevels = [];
  services = [];
  configActions = [];
  commands = [];
  strings = {};

  constructor(chaos, options) {
    super(chaos);
    Object.assign(this, options);

    this.chaos.on('chaos.listen', () => {
      this.pluginService = this.chaos.getService('core', 'PluginService');
    });
  }

  isEnabled(guild) {
    return this.pluginService.isPluginEnabled(guild.id, this.name);
  }

  getCommand(commandName) {
    return this.commands.find((c) => c.name.toLowerCase() === commandName.toLowerCase());
  }

  getService(serviceName) {
    return this.chaos.getService(this.name, serviceName);
  }

  getConfigAction(actionName) {
    return this.chaos.getConfigAction(this.name, actionName);
  }
}

module.exports = Plugin;
