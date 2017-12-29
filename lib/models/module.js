class Module {
  constructor(options) {
    let allowedProps = [
      'name',
      'enabledByDefault',
      'defaultData',
      'configActions',
      'commands',
    ];

    this.name = 'Name';
    this.enabledByDefault = true;
    this.defaultData = [];
    this.configActions = [];
    this.commands = [];

    allowedProps.forEach((property) => {
      let optionValue = options[property];
      if (typeof optionValue !== 'undefined') {
        this[property] = optionValue;
      }
    });
  }
}

module.exports = Module;
