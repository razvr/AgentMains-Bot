const Rx = require('rx');

class DataService {
  /**
   *
   * @param nix
   * @param config
   * @param config.type
   */
  constructor(nix, config) {
    this.nix = nix;
    this._dataSource = null;

    this._cache = {};

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
        throw Error('Unknown dataService source type');
    }

    this._dataSource = new DataSource(nix, config);
  }

  get type() {
    return this._dataSource.type;
  }

  onNixListen() {
    if (typeof this._dataSource.ononNixListen === 'undefined') { return Rx.Observable.of(true); }
    return this._dataSource.onNixListen();
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
    return this._setData('guild', guildId, keyword, data);
  }

  /**
   *
   * @param guildId
   *
   * @param keyword
   * @return {Rx.Observable}
   */
  getGuildData(guildId, keyword) {
    return this._getData('guild', guildId, keyword);
  }

  _getData(type, id, keyword) {
    let cacheKey = `${type}:${id}:${keyword}`;
    let cached = this._cache[cacheKey];

    if(cached && cached.expiresAt > Date.now()) {
      console.log('{INFO}', '[dataService cache]', cacheKey, '=>', cached.data);
      return Rx.Observable.return(cached.data);
    }

    return this._dataSource.getData(type, id, keyword)
      .do((savedData) => console.log('{INFO}', '[dataService read]', cacheKey, '=>', savedData))
      .do((savedData) => this._updateCache(cacheKey, savedData));
  }

  _setData(type, id, keyword, data) {
    let cacheKey = `${type}:${id}:${keyword}`;

    return this._dataSource.setData(type, id, keyword, data)
      .do((savedData) => console.log('{INFO}', '[dataService write]', cacheKey, '=>', savedData))
      .do((savedData) => this._updateCache(cacheKey, savedData));
  }

  _updateCache(cacheKey, data) {
    this._cache[cacheKey] = {
      expiresAt: Date.now() + 300000, // 5 min in ms
      data,
    };
  }
}


module.exports = DataService;
