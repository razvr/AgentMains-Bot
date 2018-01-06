class Module {
  constructor(options) {
    let allowedProps = [
      'name',
      'enabledByDefault',
      'permissions',
      'defaultData',
      'configActions',
      'commands',

      'onNixListen',
    ];

    this.name = 'Name';
    this.enabledByDefault = true;
    this.permissions = [];
    this.defaultData = [];
    this.configActions = [];
    this.commands = [];

    this.onNixListen = undefined;
    allowedProps.forEach((property) => {
      let optionValue = options[property];
      if (typeof optionValue !== 'undefined') {
        this[property] = optionValue;
      }
    });
  }
}

module.exports = Module;
