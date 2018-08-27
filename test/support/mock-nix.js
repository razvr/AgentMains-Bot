const Rx = require('rx');

const MockNixLogger = require("./mock-logger");
const NixConfig = require("../../lib/models/nix-config");
const defaultResponseStrings = require("../../lib/utility/reponse-strings");

class MockNix {
  constructor() {
    this.logger = new MockNixLogger();

    this.config = new NixConfig();

    this.services = {};

    this.dataManager = {};
    this.commandManager = {};
    this.servicesManager = {};
    this.moduleManager = {};
    this.configManager = {};
    this.permissionsManager = {};

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
