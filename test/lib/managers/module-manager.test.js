const PluginManager = require('../../../lib/managers/plugin-manager');
const Service = require("../../../lib/models/service");

describe('PluginManager', function () {
  beforeEach(function () {
    this.nix = createNixStub();
    this.pluginManager = new PluginManager(this.nix);
  });

  describe(".nix", function () {
    it('returns the nix reference that the manager was constructed with', function () {
      expect(this.pluginManager.nix).to.eq(this.nix);
    });
  });

  describe(".plugins", function () {
    context('when no plugins have been added', function () {
      it('returns an empty list of plugins', function () {
        expect(this.pluginManager.plugins).to.deep.eq([]);
      });
    });

    context('when plugins have been added', function () {
      beforeEach(function () {
        this.moduleOne = { name: "moduleOne" };
        this.moduleTwo = { name: "moduleTwo" };
        this.moduleThree = { name: "moduleThree" };

        this.pluginManager.addPlugin(this.moduleOne);
        this.pluginManager.addPlugin(this.moduleTwo);
        this.pluginManager.addPlugin(this.moduleThree);
      });

      it('returns a list of all added plugins', function () {
        expect(this.pluginManager.plugins.map((m) => m.name)).to.deep.eq([
          "moduleOne",
          "moduleTwo",
          "moduleThree",
        ]);
      });
    });
  });

  describe("constructor", function () {
    it('initializes the manager with an empty module list', function () {
      expect(this.pluginManager.plugins).to.deep.eq([]);
    });
  });

  describe("#getPlugin", function () {
    context('when the module has been added', function () {
      beforeEach(function () {
        this.testPlugin = { name: "TestPlugin" };
        this.pluginManager.addPlugin(this.testPlugin);
      });

      it('returns the module', function () {
        expect(this.pluginManager.getPlugin('TestPlugin').name).to.eq("TestPlugin");
      });
    });

    context('when the module has not been added', function () {
      it('raises an error', function () {
        expect(() => this.pluginManager.getPlugin('TestPlugin')).to.throw(
          Error, "Plugin 'TestPlugin' could not be found.",
        );
      });
    });
  });

  describe("#addPlugin", function () {
    beforeEach(function () {
      this.testPlugin = { name: "TestPlugin" };
    });

    it('makes the module retrievable via #getPlugin', function () {
      this.pluginManager.addPlugin(this.testPlugin);
      expect(this.pluginManager.getPlugin('TestPlugin').name).to.eq("TestPlugin");
    });

    context('when the module has already been added', function () {
      beforeEach(function () {
        this.pluginManager.addPlugin(this.testPlugin);
      });

      it('raises an error', function () {
        expect(() => this.pluginManager.addPlugin(this.testPlugin)).to.throw(
          Error, "Plugin 'TestPlugin' has already been added.",
        );
      });
    });

    context('when the module has services', function () {
      class ServiceOne extends Service {
      }

      class ServiceTwo extends Service {
      }

      beforeEach(function () {
        this.testPlugin.services = [
          ServiceOne,
          ServiceTwo,
        ];
      });

      it('adds all services to nix', function () {
        spy(this.nix, 'addService');

        this.pluginManager.addPlugin(this.testPlugin);

        expect(this.nix.addService).to.have.been
          .calledWith("TestPlugin", this.testPlugin.services[0]);
        expect(this.nix.addService).to.have.been
          .calledWith("TestPlugin", this.testPlugin.services[1]);
      });
    });

    context('when the module has config actions', function () {
      beforeEach(function () {
        this.testPlugin.configActions = [
          { name: "testActionOne" },
          { name: "testActionTwo" },
        ];
      });

      it('adds all config actions to nix', function () {
        spy(this.nix, 'addConfigAction');

        this.pluginManager.addPlugin(this.testPlugin);

        expect(this.nix.addConfigAction).to.have.been
          .calledWith("TestPlugin", this.testPlugin.configActions[0]);
        expect(this.nix.addConfigAction).to.have.been
          .calledWith("TestPlugin", this.testPlugin.configActions[1]);
      });
    });

    context('when the module has commands', function () {
      beforeEach(function () {
        this.testPlugin.commands = [
          { name: "testActionOne", run: fake() },
          { name: "testActionTwo", run: fake() },
        ];
      });

      it('adds all commands to nix', function () {
        spy(this.nix, 'addCommand');

        this.pluginManager.addPlugin(this.testPlugin);

        expect(this.nix.addCommand).to.have.been
          .calledWith(this.testPlugin.commands[0]);
        expect(this.nix.addCommand).to.have.been
          .calledWith(this.testPlugin.commands[1]);
      });
    });

    context('when the module has new permission levels', function () {
      beforeEach(function () {
        this.testPlugin.permissions = [
          "test1",
          "test2",
        ];
      });

      it('adds all permission levels to nix', function () {
        spy(this.nix, 'addPermissionLevel');

        this.pluginManager.addPlugin(this.testPlugin);

        expect(this.nix.addPermissionLevel).to.have.been
          .calledWith(this.testPlugin.permissions[0]);
        expect(this.nix.addPermissionLevel).to.have.been
          .calledWith(this.testPlugin.permissions[1]);
      });
    });
  });

  describe('#onNixListen', function () {
    context('when plugins have a onNixListen hook', function () {
      beforeEach(function () {
        this.testPlugin1 = { name: "TestPlugin1", onNixListen: sinon.fake() };
        this.testPlugin2 = { name: "TestPlugin2", onNixListen: sinon.fake() };
        this.testPlugin3 = { name: "TestPlugin3", onNixListen: sinon.fake() };

        this.pluginManager.addPlugin(this.testPlugin1);
        this.pluginManager.addPlugin(this.testPlugin2);
        this.pluginManager.addPlugin(this.testPlugin3);
      });

      it('triggers the hook for each', function (done) {
        this.pluginManager
          .onNixListen()
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.testPlugin1.onNixListen).to.have.been.calledOnce;
            expect(this.testPlugin2.onNixListen).to.have.been.calledOnce;
            expect(this.testPlugin3.onNixListen).to.have.been.calledOnce;
            done();
          });
      });
    });
  });

  describe('#onNixJoinGuild', function () {
    context('when plugins have a onNixJoinGuild hook', function () {
      beforeEach(function () {
        this.testPlugin1 = { name: "TestPlugin1", onNixJoinGuild: sinon.fake() };
        this.testPlugin2 = { name: "TestPlugin2", onNixJoinGuild: sinon.fake() };
        this.testPlugin3 = { name: "TestPlugin3", onNixJoinGuild: sinon.fake() };

        this.pluginManager.addPlugin(this.testPlugin1);
        this.pluginManager.addPlugin(this.testPlugin2);
        this.pluginManager.addPlugin(this.testPlugin3);
      });

      it('triggers the hook for each', function (done) {
        this.pluginManager
          .onNixJoinGuild()
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.testPlugin1.onNixJoinGuild).to.have.been.calledOnce;
            expect(this.testPlugin2.onNixJoinGuild).to.have.been.calledOnce;
            expect(this.testPlugin3.onNixJoinGuild).to.have.been.calledOnce;
            done();
          });
      });
    });
  });
});
