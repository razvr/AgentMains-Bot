class DataManager {
  /**
   *
   * @param config
   * @param config.type
   */
  constructor(config) {
    let DataSource;

    switch (config.type) {
      case 'disk':
        DataSource = require('./nix-data-disk');
        break;
      case 'none':
        DataSource = require('./nix-data-none');
        break;
      default:
        throw Error('Unknown data source type');
    }

    this._dataSource = new DataSource(config);
  }

  /**
   *
   * @param guildId
   * @param data
   *
   * @return {Rx.Observable}
   */
  setGuildData(guildId, data) {
    return this._dataSource.setData('guild', guildId, data);
  };

  /**
   *
   * @param guildId
   *
   * @return {Rx.Observable}
   */
  getGuildData(guildId) {
    return this._dataSource.getData('guild', guildId);
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
