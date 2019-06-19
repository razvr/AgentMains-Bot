const ChaosComponent = require('./chaos-component');

class Plugin extends ChaosComponent {
  constructor(chaos, options) {
    super(chaos);

    this.dependencies = [];

    this.name = 'Name';
    this.description = null;

    this.defaultData = [];

    this.permissions = [];
    this.services = [];
    this.configActions = [];
    this.commands = [];

    Object.assign(this, options);

    this.chaos.on('chaos.listen', () => {
      this.pluginService = this.chaos.getService('core', 'PluginService');
    });
  }

  isEnabled(guild) {
    return this.pluginService.isPluginEnabled(guild.id, this.name);
  }
}

module.exports = Plugin;
