const ModuleManager = require('../../../lib/managers/module-manager');
const Service = require("../../../lib/models/service");

describe('ModuleManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.moduleManager = new ModuleManager(this.chaos);
  });

  describe(".chaos", function () {
    it('returns the chaos reference that the manager was constructed with', function () {
      expect(this.moduleManager.chaos).to.eq(this.chaos);
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

      it('adds all services to chaos', function () {
        spy(this.chaos, 'addService');

        this.moduleManager.addModule(this.testModule);

        expect(this.chaos.addService).to.have.been
          .calledWith("TestModule", this.testModule.services[0]);
        expect(this.chaos.addService).to.have.been
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

      it('adds all config actions to chaos', function () {
        spy(this.chaos, 'addConfigAction');

        this.moduleManager.addModule(this.testModule);

        expect(this.chaos.addConfigAction).to.have.been
          .calledWith("TestModule", this.testModule.configActions[0]);
        expect(this.chaos.addConfigAction).to.have.been
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

      it('adds all commands to chaos', function () {
        spy(this.chaos, 'addCommand');

        this.moduleManager.addModule(this.testModule);

        expect(this.chaos.addCommand).to.have.been
          .calledWith(this.testModule.commands[0]);
        expect(this.chaos.addCommand).to.have.been
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

      it('adds all permission levels to chaos', function () {
        spy(this.chaos, 'addPermissionLevel');

        this.moduleManager.addModule(this.testModule);

        expect(this.chaos.addPermissionLevel).to.have.been
          .calledWith(this.testModule.permissions[0]);
        expect(this.chaos.addPermissionLevel).to.have.been
          .calledWith(this.testModule.permissions[1]);
      });
    });
  });

  describe('#onListen', function () {
    context('when modules have a onListen hook', function () {
      beforeEach(function () {
        this.testModule1 = { name: "TestModule1", onListen: sinon.fake() };
        this.testModule2 = { name: "TestModule2", onListen: sinon.fake() };
        this.testModule3 = { name: "TestModule3", onListen: sinon.fake() };

        this.moduleManager.addModule(this.testModule1);
        this.moduleManager.addModule(this.testModule2);
        this.moduleManager.addModule(this.testModule3);
      });

      it('triggers the hook for each', function (done) {
        this.moduleManager
          .onListen()
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.testModule1.onListen).to.have.been.calledOnce;
            expect(this.testModule2.onListen).to.have.been.calledOnce;
            expect(this.testModule3.onListen).to.have.been.calledOnce;
            done();
          });
      });
    });
  });

  describe('#onJoinGuild', function () {
    context('when modules have a onJoinGuild hook', function () {
      beforeEach(function () {
        this.testModule1 = { name: "TestModule1", onJoinGuild: sinon.fake() };
        this.testModule2 = { name: "TestModule2", onJoinGuild: sinon.fake() };
        this.testModule3 = { name: "TestModule3", onJoinGuild: sinon.fake() };

        this.moduleManager.addModule(this.testModule1);
        this.moduleManager.addModule(this.testModule2);
        this.moduleManager.addModule(this.testModule3);
      });

      it('triggers the hook for each', function (done) {
        this.moduleManager
          .onJoinGuild()
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.testModule1.onJoinGuild).to.have.been.calledOnce;
            expect(this.testModule2.onJoinGuild).to.have.been.calledOnce;
            expect(this.testModule3.onJoinGuild).to.have.been.calledOnce;
            done();
          });
      });
    });
  });
});
