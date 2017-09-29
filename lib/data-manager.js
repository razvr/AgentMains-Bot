class DataManager {
  /**
   *
   * @param config
   * @param config.type
   */
  constructor (config) {
    switch (config.type) {
      case 'disk':
        let NixDataDisk = require('./nix-data-disk');
        this._dataSource = new NixDataDisk(config);
        break;
      default:
        throw Error('Unknown data source type');
    }
  }

  /**
   *
   * @param guildId
   * @param data
   *
   * @return {Rx.Observable}
   */
  setGuildData (guildId, data) {
    return this._dataSource.setData('guild', guildId, data);
  };

  /**
   *
   * @param guildId
   *
   * @return {Rx.Observable}
   */
  getGuildData (guildId) {
    return this._dataSource.getData('guild', guildId);
  };
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
