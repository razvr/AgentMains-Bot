const ChaosComponent = require('./chaos-component');

class ConfigAction extends ChaosComponent {
  constructor(chaos, options) {
    super(chaos);

    this.name = null;
    this.pluginName = null;
    this.description = null;

    this.inputs = [];

    Object.assign(this, options);
  }

  run() {}
}

module.exports = ConfigAction;
