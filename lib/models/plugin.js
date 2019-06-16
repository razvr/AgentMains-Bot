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
  }
}

module.exports = Plugin;
