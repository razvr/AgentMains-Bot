class Plugin {
  constructor(options) {
    this.name = 'Name';
    this.enabledByDefault = false;

    this.defaultData = [];

    this.permissions = [];
    this.services = [];
    this.configActions = [];
    this.commands = [];

    this.onListen = undefined;
    this.onEnabled = undefined;
    this.onDisabled = undefined;

    Object.assign(this, options);
  }
}

module.exports = Plugin;
