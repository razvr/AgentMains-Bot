const ChaosComponent = require('./chaos-component');

class ConfigAction extends ChaosComponent {
  constructor(chaos, options) {
    super(chaos);

    this.name = null;
    this.pluginName = null;
    this.description = null;

    this.inputs = [];

    this.run = () => {};

    Object.assign(this, options);
  }
}

module.exports = ConfigAction;
