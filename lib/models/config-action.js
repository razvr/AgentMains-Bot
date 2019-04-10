class ConfigAction {
  constructor(options) {
    this.nix = null;

    this.name = null;
    this.pluginName = null;
    this.description = null;

    this.services = {};
    this.inputs = [];

    this.run = () => {};

    Object.assign(this, options);
  }
}

module.exports = ConfigAction;
