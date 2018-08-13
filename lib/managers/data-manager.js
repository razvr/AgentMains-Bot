const util = require('util');
const Rx = require('rx');

class DataManager {
  get nix() {
    return this._nix;
  }

  constructor(nix) {
    this._nix = nix;

    this._dataSource = null;
    this._cache = {};

    this.setGuildData = this.setGuildData.bind(this);
    this.getGuildData = this.getGuildData.bind(this);

    this._prepareDataSource();
  }

  get type() {
    return this._dataSource.type;
  }

  onNixListen() {
    if (typeof this._dataSource.onNixListen === 'undefined') { return Rx.Observable.of(true); }
    return this._dataSource.onNixListen();
  }

  onNixJoinGuild(guild) {
    if (typeof this._dataSource.onNixJoinGuild === 'undefined') { return Rx.Observable.of(true); }
    return this._dataSource.onNixJoinGuild(guild);
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

  _prepareDataSource () {
    let dataSourceConfig = this.nix.config.dataSource || {};

    let DataSource;
    let dataSourceType = dataSourceConfig.type || 'memory';
    let npmPackageName = `nix-data-${dataSourceType}`;

    try {
      DataSource = require(npmPackageName);
    }
    catch (error) {
      error = new Error(`Unable to load data source '${npmPackageName}'. Is the npm module '${npmPackageName}' installed?`);
      error.name = "DataSourceError";
      throw error;
    }

    this._dataSource = new DataSource(this.nix, this.nix.config.dataSource);
    this.nix.logger.verbose(`Loaded data source ${npmPackageName}`);
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


module.exports = DataManager;
