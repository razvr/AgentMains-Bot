class DataManager {
  /**
   *
   * @param config
   * @param config.type
   */
  constructor(config) {
    this._dataSource = null;

    let DataSource;
    switch (config.type) {
      case 'disk':
        DataSource = require('../data-sources/nix-data-disk');
        break;
      case 'memory':
        DataSource = require('../data-sources/nix-data-memory');
        break;
      case 'none':
        DataSource = require('../data-sources/nix-data-none');
        break;
      default:
        throw Error('Unknown data source type');
    }

    this._dataSource = new DataSource(config);
  }

  get type() {
    return this._dataSource.type;
  }

  /**
   *
   * @param guildId
   * @param keyword
   * @param data
   *
   * @return {Rx.Observable}
   */
  setGuildData(guildId, keyword, data) {
    return this._dataSource.setData('guild', guildId, keyword, data);
  };

  /**
   *
   * @param guildId
   *
   * @param keyword
   * @return {Rx.Observable}
   */
  getGuildData(guildId, keyword) {
    return this._dataSource.getData('guild', guildId, keyword);
  };

  formatForMsg(value) {
    switch (typeof value) {
      case "undefined":
        return "[undefined]";
      case "object":
        return JSON.stringify(value, null, '  ');
      default:
        return value.toString();
    }
  };
}


module.exports = DataManager;
