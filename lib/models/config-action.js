class ConfigAction {
  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  constructor(options) {
    this.chaos = null;

    this.name = null;
    this.moduleName = null;
    this.description = null;

    this.services = {};
    this.inputs = [];

    this.run = () => {};

    Object.assign(this, options);
  }
}

module.exports = ConfigAction;
