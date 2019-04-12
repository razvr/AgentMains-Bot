class MockCommand {
  constructor() {
    this.chaos = 'mock_chaos';
    this.moduleName = 'mock_module';
    this.name = 'mockCommand';
    this.description = 'mock';
    this.run = sinon.fake();

    this.ownerOnly = false;
    this.adminOnly = false;
    this.permissions = [];
    this.enabledByDefault = true;
    this.showInHelp = true;

    this.flags = [];
    this.args = [];
    this.services = [];
  }
}

module.exports = MockCommand;
