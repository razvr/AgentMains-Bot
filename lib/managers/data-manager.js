const util = require('util');
const Rx = require('rx');
const { toObservable } = require('../utility');

class DataSourceError extends Error {}

class DataManager {
  get chaos() {
    return this._chaos;
  }

  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  constructor(chaos) {
    this._chaos = chaos;

    this._dataSource = null;
    this._cache = {};

    this.setGuildData = this.setGuildData.bind(this);
    this.getGuildData = this.getGuildData.bind(this);

    this._prepareDataSource();
  }

  get type() {
    return this._dataSource.type;
  }

  onListen() {
    if (this._dataSource.onNixListen) {
      this.chaos.logger.warn('onNixListen is deprecated. Please use onListen');
      return toObservable(this._dataSource.onNixListen());
    } else if (this._dataSource.onListen) {
      return toObservable(this._dataSource.onListen());
    } else {
      return Rx.Observable.of(true);
    }
  }

  onJoinGuild(guild) {
    if (this._dataSource.onNixJoinGuild) {
      this.chaos.logger.warn('onNixJoinGuild is deprecated. Please use onJoinGuild');
      return toObservable(this._dataSource.onNixJoinGuild(guild));
    } else if (this._dataSource.onJoinGuild) {
      return toObservable(this._dataSource.onJoinGuild(guild));
    } else {
      return Rx.Observable.of(true);
    }
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

  _prepareDataSource() {
    let dataSourceConfig = this.chaos.config.dataSource || {};

    let DataSource;
    let dataSourceType = dataSourceConfig.type || 'memory';
    let npmPackageName = `chaos-data-${dataSourceType}`;

    try {
      DataSource = require(npmPackageName);
    } catch (error) {
      throw new DataSourceError(`Unable to load data source '${npmPackageName}'. Is the npm module '${npmPackageName}' installed?`);
    }

    this._dataSource = new DataSource(this.chaos, this.chaos.config.dataSource);
    this.chaos.logger.verbose(`Loaded data source ${npmPackageName}`);
  }

  _getData(type, id, keyword) {
    let cacheKey = `${type}:${id}:${keyword}`;
    let cached = this._cache[cacheKey];

    if (cached && cached.expiresAt > Date.now()) {
      this.chaos.logger.data(`[cache]\t${cacheKey} => ${util.inspect(cached.data)}`);
      return Rx.Observable.return(cached.data);
    }

    return this._dataSource.getData(type, id, keyword)
      .do((savedData) => this.chaos.logger.data(`[read]\t${cacheKey} => ${util.inspect(savedData)}`))
      .do((savedData) => this._updateCache(cacheKey, savedData));
  }

  _setData(type, id, keyword, data) {
    let cacheKey = `${type}:${id}:${keyword}`;

    return this._dataSource.setData(type, id, keyword, data)
      .do((savedData) => this.chaos.logger.data(`[write]\t${cacheKey} => ${util.inspect(savedData)}`))
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
module.exports.DataSourceError = DataSourceError;
