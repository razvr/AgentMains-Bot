const ModuleManager = require('../../../lib/managers/module-manager');
const Service = require("../../../lib/models/service");

describe('ModuleManager', function () {
  beforeEach(function () {
    this.nix = createNixStub();
    this.moduleManager = new ModuleManager(this.nix);
  });

  describe(".nix", function () {
    it('returns the nix reference that the manager was constructed with', function () {
      expect(this.moduleManager.nix).to.eq(this.nix);
    });
  });

  describe(".modules", function () {
    context('when no modules have been added', function () {
      it('returns an empty list of modules', function () {
        expect(this.moduleManager.modules).to.deep.eq([]);
      });
    });

    context('when modules have been added', function () {
      beforeEach(function () {
        this.moduleOne = { name: "moduleOne" };
        this.moduleTwo = { name: "moduleTwo" };
        this.moduleThree = { name: "moduleThree" };

        this.moduleManager.addModule(this.moduleOne);
        this.moduleManager.addModule(this.moduleTwo);
        this.moduleManager.addModule(this.moduleThree);
      });

      it('returns a list of all added modules', function () {
        expect(this.moduleManager.modules.map((m) => m.name)).to.deep.eq([
          "moduleOne",
          "moduleTwo",
          "moduleThree",
        ]);
      });
    });
  });

  describe("constructor", function () {
    it('initializes the manager with an empty module list', function () {
      expect(this.moduleManager.modules).to.deep.eq([]);
    });
  });

  describe("#getModule", function () {
    context('when the module has been added', function () {
      beforeEach(function () {
        this.testModule = { name: "TestModule" };
        this.moduleManager.addModule(this.testModule);
      });

      it('returns the module', function () {
        expect(this.moduleManager.getModule('TestModule').name).to.eq("TestModule");
      });
    });

    context('when the module has not been added', function () {
      it('raises an error', function () {
        expect(() => this.moduleManager.getModule('TestModule')).to.throw(
          Error, "Module 'TestModule' could not be found.",
        );
      });
    });
  });

  describe("#addModule", function () {
    beforeEach(function () {
      this.testModule = { name: "TestModule" };
    });

    it('makes the module retrievable via #getModule', function () {
      this.moduleManager.addModule(this.testModule);
      expect(this.moduleManager.getModule('TestModule').name).to.eq("TestModule");
    });

    context('when the module has already been added', function () {
      beforeEach(function () {
        this.moduleManager.addModule(this.testModule);
      });

      it('raises an error', function () {
        expect(() => this.moduleManager.addModule(this.testModule)).to.throw(
          Error, "Module 'TestModule' has already been added.",
        );
      });
    });

    context('when the module has services', function () {
      class ServiceOne extends Service {
      }

      class ServiceTwo extends Service {
      }

      beforeEach(function () {
        this.testModule.services = [
          ServiceOne,
          ServiceTwo,
        ];
      });

      it('adds all services to nix', function () {
        spy(this.nix, 'addService');

        this.moduleManager.addModule(this.testModule);

        expect(this.nix.addService).to.have.been
          .calledWith("TestModule", this.testModule.services[0]);
        expect(this.nix.addService).to.have.been
          .calledWith("TestModule", this.testModule.services[1]);
      });
    });

    context('when the module has config actions', function () {
      beforeEach(function () {
        this.testModule.configActions = [
          { name: "testActionOne" },
          { name: "testActionTwo" },
        ];
      });

      it('adds all config actions to nix', function () {
        spy(this.nix, 'addConfigAction');

        this.moduleManager.addModule(this.testModule);

        expect(this.nix.addConfigAction).to.have.been
          .calledWith("TestModule", this.testModule.configActions[0]);
        expect(this.nix.addConfigAction).to.have.been
          .calledWith("TestModule", this.testModule.configActions[1]);
      });
    });

    context('when the module has commands', function () {
      beforeEach(function () {
        this.testModule.commands = [
          { name: "testActionOne", run: fake() },
          { name: "testActionTwo", run: fake() },
        ];
      });

      it('adds all commands to nix', function () {
        spy(this.nix, 'addCommand');

        this.moduleManager.addModule(this.testModule);

        expect(this.nix.addCommand).to.have.been
          .calledWith(this.testModule.commands[0]);
        expect(this.nix.addCommand).to.have.been
          .calledWith(this.testModule.commands[1]);
      });
    });

    context('when the module has new permission levels', function () {
      beforeEach(function () {
        this.testModule.permissions = [
          "test1",
          "test2",
        ];
      });

      it('adds all permission levels to nix', function () {
        spy(this.nix, 'addPermissionLevel');

        this.moduleManager.addModule(this.testModule);

        expect(this.nix.addPermissionLevel).to.have.been
          .calledWith(this.testModule.permissions[0]);
        expect(this.nix.addPermissionLevel).to.have.been
          .calledWith(this.testModule.permissions[1]);
      });
    });
  });

  describe('#onNixListen', function () {
    context('when modules have a onNixListen hook', function () {
      beforeEach(function () {
        this.testModule1 = { name: "TestModule1", onNixListen: sinon.fake() };
        this.testModule2 = { name: "TestModule2", onNixListen: sinon.fake() };
        this.testModule3 = { name: "TestModule3", onNixListen: sinon.fake() };

        this.moduleManager.addModule(this.testModule1);
        this.moduleManager.addModule(this.testModule2);
        this.moduleManager.addModule(this.testModule3);
      });

      it('triggers the hook for each', function (done) {
        this.moduleManager
          .onListen()
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.testModule1.onNixListen).to.have.been.calledOnce;
            expect(this.testModule2.onNixListen).to.have.been.calledOnce;
            expect(this.testModule3.onNixListen).to.have.been.calledOnce;
            done();
          });
      });
    });
  });

  describe('#onNixJoinGuild', function () {
    context('when modules have a onNixJoinGuild hook', function () {
      beforeEach(function () {
        this.testModule1 = { name: "TestModule1", onNixJoinGuild: sinon.fake() };
        this.testModule2 = { name: "TestModule2", onNixJoinGuild: sinon.fake() };
        this.testModule3 = { name: "TestModule3", onNixJoinGuild: sinon.fake() };

        this.moduleManager.addModule(this.testModule1);
        this.moduleManager.addModule(this.testModule2);
        this.moduleManager.addModule(this.testModule3);
      });

      it('triggers the hook for each', function (done) {
        this.moduleManager
          .onJoinGuild()
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.testModule1.onNixJoinGuild).to.have.been.calledOnce;
            expect(this.testModule2.onNixJoinGuild).to.have.been.calledOnce;
            expect(this.testModule3.onNixJoinGuild).to.have.been.calledOnce;
            done();
          });
      });
    });
  });
});
