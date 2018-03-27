const util = require('util');
const Rx = require('rx');

class DataService {
  constructor(nix) {
    this.nix = nix;
    this._dataSource = null;

    this._cache = {};

    let DataSource;
    let dataSourceType = this.nix.config.dataSource.type || 'memory';
    let npmPackageName = `nix-data-${dataSourceType}`;

    try {
      DataSource = require(npmPackageName);
    }
    catch(error) {
      throw Error(`Unable to load data source ${npmPackageName}. Is the module ${npmPackageName} installed?`);
    }

    this._dataSource = new DataSource(nix, this.nix.config.dataSource);
    this.nix.logger.info(`Loaded data source ${npmPackageName}`);
  }

  get type() {
    return this._dataSource.type;
  }

  onNixJoinGuild(guild) {
    if (typeof this._dataSource.ononNixJoinGuild === 'undefined') { return Rx.Observable.of(true); }
    return this._dataSource.onNixJoinGuild(guild);
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
      this.nix.logger.data(`[cache]\t${cacheKey} => ${util.inspect(cached.data)}`);
      return Rx.Observable.return(cached.data);
    }

    return this._dataSource.getData(type, id, keyword)
      .do((savedData) => this.nix.logger.data(`[read]\t${cacheKey} => ${util.inspect(savedData)}`))
      .do((savedData) => this._updateCache(cacheKey, savedData));
  }

  _setData(type, id, keyword, data) {
    let cacheKey = `${type}:${id}:${keyword}`;

    return this._dataSource.setData(type, id, keyword, data)
      .do((savedData) => this.nix.logger.data(`[write]\t${cacheKey} => ${util.inspect(savedData)}`))
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
