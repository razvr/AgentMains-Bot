const ConfigManager = require('../../../lib/managers/config-manager');

describe('ConfigManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.configManager = new ConfigManager(this.chaos);
  });

  describe(".chaos", function () {
    it('returns a reference to chaos', function () {
      expect(this.configManager.chaos).to.eq(this.chaos);
    });
  });

  describe('.actions', function () {
    context('when no modules have been added', function () {
      it('returns an empty list of modules', function () {
        expect(this.configManager.actions).to.deep.eq([]);
      });
    });

    context('when modules have been added', function () {
      beforeEach(function () {
        this.actionOne = {name: "actionOne"};
        this.actionTwo = {name: "actionTwo"};
        this.actionThree = {name: "actionThree"};

        this.configManager.addConfigAction("test", this.actionOne);
        this.configManager.addConfigAction("test", this.actionTwo);
        this.configManager.addConfigAction("test", this.actionThree);
      });

      it('returns a list of all added config actions', function () {
        expect(this.configManager.actions.map((m) => m.name)).to.deep.eq([
          "actionOne",
          "actionTwo",
          "actionThree",
        ]);
      });
    });
  });

  describe("constructor", function () {
    it('initializes the manager with an empty module list', function () {
      expect(this.configManager.actions).to.deep.eq([]);
    });
  });

  describe("#getConfigAction", function () {
    context('when the config action has been added', function () {
      beforeEach(function () {
        this.testAction = {name: "testAction"};
        this.configManager.addConfigAction('test', this.testAction);
      });

      it('returns the module', function () {
        expect(this.configManager.getConfigAction('test', 'testAction').name)
          .to.eq("testAction");
      });
    });

    context('when the config action has not been added', function () {
      it('raises an error', function () {
        expect(() => this.configManager.getConfigAction('test', 'testAction')).to.throw(
          Error, "The config action 'test.testAction' could not be found.",
        );
      });
    });
  });

  describe("#getConfigAction", function () {
    beforeEach(function () {
      this.testAction = {name: "testAction"};
    });

    it('makes the module retrievable via #getModule', function () {
      this.configManager.addConfigAction('test', this.testAction);
      expect(this.configManager.getConfigAction('test', 'testAction').name).to.eq("testAction");
    });

    context('when the module has already been added', function () {
      beforeEach(function () {
        this.configManager.addConfigAction('test', this.testAction);
      });

      it('raises an error', function () {
        expect(() => this.configManager.addConfigAction('test', this.testAction)).to.throw(
          Error, "The config action 'test.testAction' has already been added.",
        );
      });
    });
  });
});
