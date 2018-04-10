const Winston = require('winston');

class NixLogger {
  static createLogger(config) {
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

    config.levels = NixLogger.logLevels.levels;
    Winston.addColors(NixLogger.logLevels);

    return Winston.createLogger(config);
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

module.exports = NixLogger;
