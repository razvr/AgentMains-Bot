const { ChaosError } = require("./chaos-errors");

describe("ChaosError", function () {
  describe("#constructor", function () {
    it("uses the class name as name", function () {
      let error = new ChaosError();
      expect(error.name).to.eq("ChaosError");
    });

    it("passes the message", function () {
      let error = new ChaosError("Testing Message");
      expect(error.message).to.eq("Testing Message");
    });

    context("with a extended class", function () {
      class ExtendedClassError extends ChaosError {}

      it("uses the extended class name as name", function () {
        let error = new ExtendedClassError();
        expect(error.name).to.eq("ExtendedClassError");
      });

      it("passes the message", function () {
        let error = new ExtendedClassError("Testing Message");
        expect(error.message).to.eq("Testing Message");
      });
    });
  });
});
