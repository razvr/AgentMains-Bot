const NixLogger = require("../lib/utility/nix-logger");

class MockNixLogger {
  constructor() {
    Object.keys(NixLogger.logLevels.levels).forEach((logLevel) => {
      this[logLevel] = () => {};
    });
  }
}

module.exports = MockNixLogger;
