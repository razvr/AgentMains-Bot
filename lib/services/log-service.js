const Winston = require('winston');

class LogService {
  constructor(nix, config) {
    this.nix = nix;

    config.levels = LogService.logLevels.levels;
    Winston.addColors(LogService.logLevels);

    this._logger = Winston.createLogger(config);
  }

  get logger() {
    return this._logger;
  }

  static get logLevels() {
    return {
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        data: 3,
        verbose: 4,
        debug: 5,
        discord: 6,
      },

      colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        data: 'magenta',
        verbose: 'green',
        debug: 'white',
        discord: 'grey',
      },
    };
  }
}

module.exports = LogService;
