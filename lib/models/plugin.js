const { from } = require('rxjs');
const { flatMap, filter } = require('rxjs/operators');

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

    this.onListen = undefined;
    this.onEnabled = undefined;
    this.onDisabled = undefined;

    Object.assign(this, options);
  }

  prepareData(guild) {
    return from(this.defaultData).pipe(
      flatMap((defaultData) => this.chaos.getGuildData(guild.id, defaultData.keyword).pipe(
        filter((savedData) => typeof savedData === 'undefined'),
        flatMap(() => this.chaos.setGuildData(guild.id, defaultData.keyword, defaultData.data)),
      )),
    );
  }
}

module.exports = Plugin;
