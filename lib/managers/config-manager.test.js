const ConfigManager = require('./config-manager');
const createChaosStub = require('../test/create-chaos-stub');
const { ConfigAction } = require("../../index");

describe('ConfigManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.configManager = new ConfigManager(this.chaos);
  });

  describe(".chaos", function () {
    it('returns a reference to ChaosCore', function () {
      expect(this.configManager.chaos).to.eq(this.chaos);
    });
  });

  describe('.actions', function () {
    context('when no plugins have been added', function () {
      it('returns an empty list of plugins', function () {
        expect(this.configManager.actions).to.deep.eq([]);
      });
    });

    context('when plugins have been added', function () {
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
    it('initializes the manager with an empty plugin list', function () {
      expect(this.configManager.actions).to.deep.eq([]);
    });
  });

  describe("#getConfigAction", function () {
    context('when the config action has been added', function () {
      beforeEach(function () {
        this.testAction = {name: "testAction"};
        this.configManager.addConfigAction('test', this.testAction);
      });

      it('returns the plugin', function () {
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

  describe("#addConfigAction", function () {
    class TestAction extends ConfigAction {
      constructor(chaos) {
        super(chaos, { name: "testAction" });
      }
    }

    Object.entries({
      "a object based action": { name: "testAction" },
      "a class based action": TestAction,
      "a instance based action": new TestAction(),
    }).forEach(([actionType, testAction]) => {
      beforeEach(function () {
        if (testAction instanceof TestAction) {
          // manually bind the instance to the chaos bot
          testAction._chaos = this.chaos;
        }
      });

      context(`when adding ${actionType}`, function () {
        it('makes the action retrievable via #getConfigAction', function () {
          this.configManager.addConfigAction('test', testAction);
          expect(this.configManager.getConfigAction('test', 'testAction').name).to.eq("testAction");
        });

        context('when the action has already been added', function () {
          beforeEach(function () {
            this.configManager.addConfigAction('test', testAction);
          });

          it('raises an error', function () {
            expect(() => this.configManager.addConfigAction('test', testAction)).to.throw(
              Error, "The config action 'test.testAction' has already been added.",
            );
          });
        });
      });
    });
  });
});
