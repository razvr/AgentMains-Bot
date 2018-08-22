const NixLogger = require("../../lib/utility/nix-logger");

class MockNixLogger {
  constructor(logMessages=false) {
    Object.keys(NixLogger.logLevels.levels).forEach((logLevel) => {
      this[logLevel] = (message) => {
        if(logMessages) {
          // eslint-disable-next-line no-console
          console.log(`${logLevel}: ${message}`);
        }
      };
    });
  }
}

module.exports = MockNixLogger;
