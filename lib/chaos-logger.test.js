const ChaosLogger = require("./chaos-logger");

describe('ChaosLogger', function () {
  describe('::createLogger', function () {
    it('Creates an logger', function () {
      let logger = ChaosLogger.createLogger({});

      expect(logger).to.respondTo("error");
      expect(logger).to.respondTo("warn");
      expect(logger).to.respondTo("info");
      expect(logger).to.respondTo("data");
      expect(logger).to.respondTo("verbose");
      expect(logger).to.respondTo("debug");
      expect(logger).to.respondTo("silly");
    });
  });

  describe('::.logLevels', function () {
    it('returns levels', function () {
      expect(ChaosLogger.logLevels.levels).to.not.be.undefined;
    });

    it('returns colours', function () {
      expect(ChaosLogger.logLevels.colors).to.not.be.undefined;
    });
  });
});
