const util = require('util');
const { of } = require('rxjs');
const { tap } = require('rxjs/operators');

const ChaosManager = require('../models/chaos-manager');
const { toObservable } = require('../utility');

class DataSourceError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataSourceError";
  }
}

class DataManager extends ChaosManager {
  constructor(chaos) {
    super(chaos);

    this._dataSource = null;
    this._cache = {};

    this.setGuildData = this.setGuildData.bind(this);
    this.getGuildData = this.getGuildData.bind(this);

    this._prepareDataSource();

    this.chaos.on("chaos.listen:before", () => {
      if (this._dataSource.onListen) {
        return toObservable(this._dataSource.onListen());
      } else {
        return of(true);
      }
    });

    this.chaos.on("guildCreate:before", (guild) => {
      if (this._dataSource.onJoinGuild) {
        return toObservable(this._dataSource.onJoinGuild(guild));
      } else {
        return of(true);
      }
    });
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
   * @return {Observable}
   */
  setGuildData(guildId, keyword, data) {
    return this._setData('guild', guildId, keyword, data);
  }

  /**
   *
   * @param guildId
   *
   * @param keyword
   * @return {Observable}
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
      if (error.code === "MODULE_NOT_FOUND") {
        throw new DataSourceError(`Unable to load data source '${npmPackageName}'. Is the npm module '${npmPackageName}' installed?`);
      } else {
        throw error;
      }
    }

    this._dataSource = new DataSource(this.chaos, this.chaos.config.dataSource);
    this.chaos.logger.verbose(`Loaded data source ${npmPackageName}`);
  }

  _getData(type, id, keyword) {
    let cacheKey = `${type}:${id}:${keyword}`;
    let cached = this._cache[cacheKey];

    if (cached && cached.expiresAt > Date.now()) {
      this.chaos.logger.data(`[cache]\t${cacheKey} => ${util.inspect(cached.data)}`);
      return of(cached.data);
    }

    return this._dataSource.getData(type, id, keyword).pipe(
      tap((savedData) => this.chaos.logger.data(`[read]\t${cacheKey} => ${util.inspect(savedData)}`)),
      tap((savedData) => this._updateCache(cacheKey, savedData)),
    );
  }

  _setData(type, id, keyword, data) {
    let cacheKey = `${type}:${id}:${keyword}`;

    return this._dataSource.setData(type, id, keyword, data).pipe(
      tap((savedData) => this.chaos.logger.data(`[write]\t${cacheKey} => ${util.inspect(savedData)}`)),
      tap((savedData) => this._updateCache(cacheKey, savedData)),
    );
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
