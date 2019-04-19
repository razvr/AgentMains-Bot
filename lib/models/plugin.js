const Rx = require('rx');


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
    return Rx.Observable.from(this.defaultData)
      .flatMap((defaultData) =>
        this.chaos.getGuildData(guild.id, defaultData.keyword)
          .filter((savedData) => typeof savedData === 'undefined')
          .flatMap(() => this.chaos.setGuildData(guild.id, defaultData.keyword, defaultData.data)),
      );
  }
}

module.exports = Plugin;
