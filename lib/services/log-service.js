const Winston = require('winston');

class LogService {
  constructor(nix, config) {
    this.nix = nix;

    config = Object.assign({
      level: 'info',
      format: Winston.format.combine(
        Winston.format.colorize(),
        Winston.format.align(),
        Winston.format.printf((info) => `${info.level}: ${info.message}`)
      ),
      transports: [
        new Winston.transports.Console({
          stderrLevels: ['error'],
        }),
      ],
    }, config);

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
        data: 2,
        info: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
      },

      colors: {
        error: 'red',
        warn: 'yellow',
        data: 'magenta',
        info: 'green',
        verbose: 'green',
        debug: 'white',
        silly: 'rainbow',
      },
    };
  }
}

module.exports = LogService;
