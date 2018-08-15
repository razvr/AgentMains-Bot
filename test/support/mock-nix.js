const MockNixLogger = require("./mock-logger");

class MockNix {
  constructor() {
    this.logger = new MockNixLogger();

    this.config = {};

    this.services = {};

    this.addService = sinon.fake();
    this.addCommand = sinon.fake();
    this.addConfigAction = sinon.fake();
    this.addPermissionLevel = sinon.fake();
  }

  getService(module, serviceName) {
    return this.services[module][serviceName];
  }
}

module.exports = MockNix;
