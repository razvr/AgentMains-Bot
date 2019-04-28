const { from } = require('rxjs');
const { flatMap, filter } = require('rxjs/operators');

class Plugin {
  constructor(options) {
    delete options.chaos;
    this.chaos = null;

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

  bindChaos(chaos) {
    this.chaos = chaos;
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
