class MockCommand {
  constructor() {
    this.nix = 'mock_nix';
    this.pluginName = 'mock_module';
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
