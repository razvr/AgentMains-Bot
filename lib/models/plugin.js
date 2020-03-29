class Plugin {
  constructor(chaos, options) {
    this.chaos = chaos;
    this.logger = chaos.logger;

    this.dependencies = [];

    this.name = 'Name';
    this.description = null;

    this.defaultData = [];

    this.permissionLevels = [];
    this.services = [];
    this.configActions = [];
    this.commands = [];
    this.strings = {};

    if (options.permissions) {
      this.logger.warn(`\`permissions\` option on Plugins is deprecated, please use \`permissionLevels\` instead.`);
      options.permissionLevels = options.permissions;
      delete options.permissions;
    }

    Object.assign(this, options);

    this.chaos.on('chaos.listen', () => {
      this.pluginService = this.chaos.getService('core', 'PluginService');
    });
  }

  get permissions() {
    this.logger.warn(`\`Plugin#permissions\` is deprecated, please use \`Plugin#permissionLevels\` instead.`);
    return this.permissionLevels;
  }

  isEnabled(guild) {
    return this.pluginService.isPluginEnabled(guild.id, this.name);
  }

  validate() {
    return true;
  }
}

module.exports = Plugin;
