const fs = require('fs');
const Path = require('path');
const Rx = require('rx');

class DataManager {
  constructor (config) {
    this._dataDir = config.dataDir;

    if (!fs.existsSync(this._dataDir)) {
      fs.mkdirSync(this._dataDir);
    }

    if (!fs.existsSync(Path.join(this._dataDir, 'guilds'))) {
      fs.mkdirSync(Path.join(this._dataDir, 'guilds'));
    }
  }

  setGuildData (guildId, data) {
    let guildDataFilename = this._getGuildDataFilename(guildId);

    return this.getGuildData(guildId)
      .map((existingData) => Object.assign(existingData, data))
      .map((newData) => JSON.stringify(newData, null, '  '))
      .flatMap((newContents) => Rx.Observable.fromNodeCallback(fs.writeFile)(guildDataFilename, newContents))
      .flatMap(() => this.getGuildData(guildId));
  };

  getGuildData (guildId) {
    let guildDataFilename = this._getGuildDataFilename(guildId);

    return Rx.Observable.fromNodeCallback(fs.readFile)(guildDataFilename)
      .map((contents) => JSON.parse(contents))
      .catch((err) => {
        if (err.code === "ENOENT") {
          return Rx.Observable.fromNodeCallback(fs.writeFile)(guildDataFilename, "{}")
            .flatMap(() => this.getGuildData(guildId));
        } else {
          throw err;
        }
      });
  };

  _getGuildDataFilename(guildId) {
    return Path.join(this._dataDir, "guilds", guildId + ".json");
  }
}

DataManager.formatForMsg = function(value) {
  switch (typeof value) {
    case "undefined":
      return "[undefined]";
    case "object":
      return JSON.stringify(value, null, '  ');
    default:
      return value.toString();
  }
};

module.exports = DataManager;
