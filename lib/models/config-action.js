class ConfigAction {
  constructor(options) {
    this.name = null;
    this.description = null;

    this.services = {};
    this.inputs = [];

    this.run = () => {
      console.log('boop?');
    };

    Object.assign(this, options);
  }
}

module.exports = ConfigAction;
