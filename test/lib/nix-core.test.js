const Rx = require('rx');
const Discord = require('discord.js');

const MockClient = require('../support/discord/mock-client');

const Nix = require('../../lib/nix-core');
const DataManager = require('../../lib/managers/data-manager');
const CommandManager = require('../../lib/managers/command-manager');
const ServicesManager = require('../../lib/managers/services-manager');
const ModuleManager = require('../../lib/managers/module-manager');
const ConfigManager = require('../../lib/managers/config-manager');
const PermissionsManager = require('../../lib/managers/permissions-manager');

describe('Nix', function () {
  beforeEach(function () {
    this.config = {
      ownerUserId: "mock_ownerUserId",
      loginToken: "mock_loginToken",
      logger: { silent: true },
    };

    this.nix = new Nix(this.config);
    this.nextCallback = sinon.fake();
  });

  describe('constructor', function () {
    beforeEach(function () {
      sinon.stub(CommandManager.prototype, 'loadCommands');
      sinon.stub(ServicesManager.prototype, 'loadServices');
      sinon.stub(ModuleManager.prototype, 'loadModules');

      this.nix = new Nix(this.config);
    });

    afterEach(function () {
      CommandManager.prototype.loadCommands.restore();
      ServicesManager.prototype.loadServices.restore();
      ModuleManager.prototype.loadModules.restore();
    });

    it('verifies the config', function () {
      this.config = { verifyConfig: sinon.fake() };
      this.nix = new Nix(this.config);

      expect(this.config.verifyConfig).to.have.been.called;
    });

    it('creates a new Discord client', function () {
      expect(this.nix.discord).to.be.an.instanceOf(Discord.Client);
    });

    it('creates and binds a DataManager', function () {
      expect(this.nix.dataManager).to.be.an.instanceOf(DataManager);
      expect(this.nix.setGuildData).to.eq(this.nix.dataManager.setGuildData);
      expect(this.nix.getGuildData).to.eq(this.nix.dataManager.getGuildData);
    });

    it('creates and binds a CommandManager', function () {
      expect(this.nix.commandManager).to.be.an.instanceOf(CommandManager);
      expect(this.nix.addCommand).to.eq(this.nix.commandManager.addCommand);
      expect(this.nix.getCommand).to.eq(this.nix.commandManager.getCommand);
    });

    it('creates and binds a ServicesManager', function () {
      expect(this.nix.servicesManager).to.be.an.instanceOf(ServicesManager);
      expect(this.nix.addService).to.eq(this.nix.servicesManager.addService);
      expect(this.nix.getService).to.eq(this.nix.servicesManager.getService);
    });

    it('creates and binds a ModuleManager', function () {
      expect(this.nix.moduleManager).to.be.an.instanceOf(ModuleManager);
      expect(this.nix.addModule).to.eq(this.nix.moduleManager.addModule);
      expect(this.nix.getModule).to.eq(this.nix.moduleManager.getModule);
    });

    it('creates and binds a ConfigManager', function () {
      expect(this.nix.configManager).to.be.an.instanceOf(ConfigManager);
      expect(this.nix.addConfigAction).to.eq(this.nix.configManager.addConfigAction);
      expect(this.nix.getConfigAction).to.eq(this.nix.configManager.getConfigAction);
    });

    it('creates and binds a PermissionsManager', function () {
      expect(this.nix.permissionsManager).to.be.an.instanceOf(PermissionsManager);
      expect(this.nix.addPermissionLevel).to.eq(this.nix.permissionsManager.addPermissionLevel);
      expect(this.nix.getPermissionLevel).to.eq(this.nix.permissionsManager.getPermissionLevel);
    });

    it('triggers the loading of services', function () {
      expect(this.nix.servicesManager.loadServices).to.have.been.called;
    });

    it('triggers the loading of modules', function () {
      expect(this.nix.moduleManager.loadModules).to.have.been.called;
    });

    it('triggers the loading of commands', function () {
      expect(this.nix.commandManager.loadCommands).to.have.been.called;
    });

    it('loads response strings from the config', function () {
      this.config.responseStrings = {
        test: () => 'test_string',
      };

      this.nix = new Nix(this.config);

      expect(this.nix.responseStrings.test).to.eq(this.config.responseStrings.test);
    });
  });

  describe('#listen', function () {
    beforeEach(function () {
      this.nix.discord = new MockClient();
    });

    afterEach(function (done) {
      if (this.nix.listening) {
        this.nix.shutdown();
        done();
      }
      else {
        done();
      }
    });

    it('returns an observable that emits when the bot is ready', function (done) {
      let result$ = this.nix.listen();
      expect(result$).to.be.an.instanceOf(Rx.Observable);

      result$.subscribe(
        (next) => {
          this.nextCallback(next);
          this.nix.shutdown();
        },
        (error) => done(error),
        () => {
          expect(this.nextCallback).to.have.been.calledOnceWith('Ready');
          done();
        }
      );
    });

    it('returns the same stream for multiple calls', function () {
      let result1$ = this.nix.listen();
      let result2$ = this.nix.listen();

      expect(result1$).to.eq(result2$);
    });
  });

  describe('#handleHook', function () {
    context('when the hook return value is undefined', function () {
      beforeEach(function () {
        this.returnValue = undefined;
      });

      it('turns the value into an Observable', function (done) {
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(this.nextCallback, (error) => done(error), () => {
          expect(this.nextCallback).to.have.been.calledOnceWith('');
          done();
        });
      });
    });

    context('when the hook return value an observable', function () {
      beforeEach(function () {
        this.returnValue = Rx.Observable.of('response');
      });

      it('turns the value into an Observable', function (done) {
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(this.nextCallback, (error) => done(error), () => {
          expect(this.nextCallback).to.have.been.calledOnceWith('response');
          done();
        });
      });
    });

    context('when the hook return value is a promise', function () {
      beforeEach(function () {
        this.returnValue = new Promise((resolve) => resolve('response'));
      });

      it('turns the value into an Observable', function (done) {
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(this.nextCallback, (error) => done(error), () => {
          expect(this.nextCallback).to.have.been.calledOnceWith('response');
          done();
        });
      });
    });

    context('when the hook return value is an object', function () {
      beforeEach(function () {
        this.returnValue = { returned: true };
      });

      it('turns the value into an Observable', function (done) {
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(this.nextCallback, (error) => done(error), () => {
          expect(this.nextCallback).to.have.been.calledOnceWith(this.returnValue);
          done();
        });
      });
    });
  });
});
