class Module {
  constructor(options) {
    this.name = 'Name';
    this.enabledByDefault = true;
    this.canBeDisabled = true;

    this.defaultData = [];

    this.permissions = [];
    this.services = [];
    this.configActions = [];
    this.commands = [];

    this.onNixListen = undefined;
    this.onEnabled = undefined;
    this.onDisabled = undefined;

    Object.assign(this, options);
  }
}

module.exports = Module;
