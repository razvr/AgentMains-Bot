class ConfigAction {
  constructor(options) {
    this.chaos = null;

    this.name = null;
    this.pluginName = null;
    this.description = null;

    this.inputs = [];

    this.run = () => {};

    Object.assign(this, options);
  }
}

module.exports = ConfigAction;
