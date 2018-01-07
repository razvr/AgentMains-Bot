class Module {
  constructor(options) {
    let allowedProps = [
      'name',
      'enabledByDefault',
      'permissions',
      'defaultData',
      'services',
      'configActions',
      'commands',

      'onNixListen',
      'onEnabled',
      'onDisabled',
    ];

    this.name = 'Name';
    this.enabledByDefault = true;
    this.permissions = [];
    this.defaultData = [];
    this.services = [];
    this.configActions = [];
    this.commands = [];

    this.onNixListen = undefined;
    this.onEnabled = undefined;
    this.onDisabled = undefined;

    allowedProps.forEach((property) => {
      let optionValue = options[property];
      if (typeof optionValue !== 'undefined') {
        this[property] = optionValue;
      }
    });
  }
}

module.exports = Module;
