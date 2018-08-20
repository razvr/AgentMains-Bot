const Rx = require('rx');

const MockNixLogger = require("./mock-logger");
const defaultResponseStrings = require("../../lib/utility/reponse-strings");

class MockNix {
  constructor() {
    this.logger = new MockNixLogger();

    this.config = {};

    this.services = {};

    this.addService = sinon.fake();
    this.addCommand = sinon.fake();
    this.addConfigAction = sinon.fake();
    this.addPermissionLevel = sinon.fake();

    this.responseStrings = defaultResponseStrings;

    this.handleHook = sinon.fake.returns(Rx.Observable.of(''));
  }

  getService(module, serviceName) {
    return this.services[module][serviceName];
  }
}

module.exports = MockNix;
