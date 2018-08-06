const NixLogger = require("../../../lib/utility/nix-logger");

describe('NixLogger', function () {
  describe('::createLogger', function () {
    it('Creates an logger', function () {
      let logger = NixLogger.createLogger({})

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
      expect(NixLogger.logLevels.levels).to.not.be.undefined;
    });

    it('returns colours', function () {
      expect(NixLogger.logLevels.colors).to.not.be.undefined;
    });
  });
});
