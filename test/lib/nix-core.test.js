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
      let callback = sinon.fake();
      let result$ = this.nix.listen();
      expect(result$).to.be.an.instanceOf(Rx.Observable);

      result$.subscribe(
        (next) => {
          callback(next);
          this.nix.shutdown();
        },
        (error) => done(error),
        () => {
          expect(callback).to.have.been.calledOnce;
          expect(callback).to.have.been.calledWith('Ready');
          done();
        }
      );
    });

    context('when passed observable handlers', function() {
      beforeEach(function () {
        sinon.spy(Rx.ReplaySubject.prototype, 'subscribe');
      });

      afterEach(function () {
        Rx.ReplaySubject.prototype.subscribe.restore();
      });

      it('subscribes the handlers', function () {
        let nextCallback = sinon.fake();
        let errorCallback = sinon.fake();
        let completeCallback = sinon.fake();

        let stream$ = this.nix.listen(nextCallback, errorCallback, completeCallback);
        expect(stream$.subscribe).to.have.been.calledWith(nextCallback, errorCallback, completeCallback);
      });
    });

    it('returns the same stream for multiple calls', function () {
      let result1$ = this.nix.listen();
      let result2$ = this.nix.listen();

      expect(result1$).to.eq(result2$);
    });

    it('replays the ready signal', function (done) {
      let secondListenCallback = sinon.fake();
      this.nix.listen()
        .do(() => this.nix.listen(secondListenCallback))
        .subscribe(
          () => this.nix.shutdown(),
          (error) => done(error),
          () => {
            expect(secondListenCallback).to.have.been.calledWith('Ready');
            done();
          }
        );
    });

    describe('bootstrap process', function () {
      it('injects dependencies into services', function (done) {
        sinon.spy(this.nix.servicesManager, 'injectDependencies');

        this.nix.listen(
          () => {
            expect(this.nix.servicesManager.injectDependencies).to.have.been.called;
            done();
          },
          (error) => done(error)
        );
      });

      context('when injecting into services fails', function() {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.servicesManager, 'injectDependencies').throws(this.error);
        });

        it('triggers the error callback', function (done) {
          this.nix.listen(
            () => done("Error callback was not called"),
            (error) => {
              expect(error).to.eq(this.error);
              done();
            }
          );
        });
      });

      it('injects dependencies into commands', function (done) {
        sinon.spy(this.nix.commandManager, 'injectDependencies');

        this.nix.listen(
          () => {
            expect(this.nix.commandManager.injectDependencies).to.have.been.called;
            done();
          },
          (error) => done(error)
        );
      });

      context('when injecting into commands fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.commandManager, 'injectDependencies').throws(this.error);
        });

        it('triggers the error callback', function (done) {
          this.nix.listen(
            () => done("Error callback was not called"),
            (error) => {
              expect(error).to.eq(this.error);
              done();
            }
          );
        });
      });

      it('configures services', function (done) {
        sinon.spy(this.nix.servicesManager, 'configureServices');

        this.nix.listen(
          () => {
            expect(this.nix.servicesManager.configureServices).to.have.been.called;
            done();
          },
          (error) => done(error)
        );
      });

      context('when configuring services fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.commandManager, 'injectDependencies').throws(this.error);
        });

        it('triggers the error callback', function (done) {
          this.nix.listen(
            () => done("Error callback was not called"),
            (error) => {
              expect(error).to.eq(this.error);
              done();
            }
          );
        });
      });

      it('logs into discord', function (done) {
        sinon.spy(this.nix.discord, 'login');

        this.nix
          .listen(
            () => {
              expect(this.nix.discord.login).to.have.been.calledWith(this.config.loginToken);
              done();
            },
            (error) => done(error)
          );
      });

      context('when logging into discord fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.discord, 'login').rejects(this.error);
        });

        it('triggers the error callback', function (done) {
          this.nix.listen(
            () => done("Error callback was not called"),
            (error) => {
              expect(error).to.eq(this.error);
              done();
            }
          );
        });
      });

      it('tries to find the owner', function (done) {
        sinon.spy(this.nix, 'findOwner');

        this.nix.listen(
          () => {
            expect(this.nix.findOwner).to.have.been.calledWith();
            done();
          },
          (error) => done(error)
        );
      });

      context('when finding the owner into discord fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix, 'findOwner').returns(Rx.Observable.throw(this.error));
        });

        it('triggers the error callback', function (done) {
          this.nix.listen(
            () => done("Error callback was not called"),
            (error) => {
              expect(error).to.eq(this.error);
              done();
            }
          );
        });
      });

      it('triggers the DataSource onNixListen hook', function (done) {
        sinon.spy(this.nix.dataManager, 'onNixListen');

        this.nix.listen(
          () => {
            expect(this.nix.dataManager.onNixListen).to.have.been.calledWith();
            done();
          },
          (error) => done(error)
        );
      });

      context('when DataSource onNixListen hook fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.dataManager, 'onNixListen').returns(Rx.Observable.throw(this.error));
        });

        it('triggers the error callback', function (done) {
          this.nix.listen(
            () => done("Error callback was not called"),
            (error) => {
              expect(error).to.eq(this.error);
              done();
            }
          );
        });
      });

      it('starts all Discord event streams', function (done) {
        this.nix.listen(
          () => {
            Object.values(Discord.Constants.Events).forEach((eventType) => {
              expect(this.nix.streams[eventType + '$']).to.be.an.instanceOf(Rx.Observable);
            });
            done();
          },
          (error) => done(error)
        );
      });

      it('starts nix related event streams', function (done) {
        this.nix.listen(
          () => {
            expect(this.nix.streams.command$).to.be.an.instanceOf(Rx.Observable);
            done();
          },
          (error) => done(error)
        );
      });

      it('triggers the servicesManager onNixListen hook', function (done) {
        sinon.spy(this.nix.servicesManager, 'onNixListen');

        this.nix.listen(
          () => {
            expect(this.nix.servicesManager.onNixListen).to.have.been.called;
            done();
          },
          (error) => done(error)
        );
      });

      context('when servicesManager onNixListen hook fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.servicesManager, 'onNixListen').returns(Rx.Observable.throw(this.error));
        });

        it('triggers the error callback', function (done) {
          this.nix.listen(
            () => done("Error callback was not called"),
            (error) => {
              expect(error).to.eq(this.error);
              done();
            }
          );
        });
      });

      it('triggers the moduleManager onNixListen hook', function (done) {
        sinon.spy(this.nix.servicesManager, 'onNixListen');

        this.nix.listen(
          () => {
            expect(this.nix.servicesManager.onNixListen).to.have.been.called;
            done();
          },
          (error) => done(error)
        );
      });

      context('when servicesManager onNixListen hook fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.moduleManager, 'onNixListen').returns(Rx.Observable.throw(this.error));
        });

        it('triggers the error callback', function (done) {
          this.nix.listen(
            () => done("Error callback was not called"),
            (error) => {
              expect(error).to.eq(this.error);
              done();
            }
          );
        });
      });

      context('when the bot has joined guilds', function () {
        beforeEach(function () {
          this.guild1 = {id: 'mock_id_1'};
          this.guild2 = {id: 'mock_id_2'};
          this.guild3 = {id: 'mock_id_3'};
          this.nix.discord.guilds.items.push(this.guild1);
          this.nix.discord.guilds.items.push(this.guild2);
          this.nix.discord.guilds.items.push(this.guild3);
        });

        it('runs the dataManager onNixJoinGuild for each', function (done) {
          sinon.spy(this.nix.dataManager, 'onNixJoinGuild');

          this.nix.listen(
            () => {
              expect(this.nix.dataManager.onNixJoinGuild).to.have.been.calledWith(this.guild1);
              expect(this.nix.dataManager.onNixJoinGuild).to.have.been.calledWith(this.guild2);
              expect(this.nix.dataManager.onNixJoinGuild).to.have.been.calledWith(this.guild3);
              done();
            },
            (error) => done(error)
          );
        });

        it('prepares default data for each', function (done) {
          let moduleService = this.nix.getService('core', 'moduleService');
          sinon.spy(moduleService, 'prepareDefaultData');

          this.nix.listen(
            () => {
              expect(moduleService.prepareDefaultData).to.have.been.calledWith(this.nix, this.guild1.id);
              expect(moduleService.prepareDefaultData).to.have.been.calledWith(this.nix, this.guild2.id);
              expect(moduleService.prepareDefaultData).to.have.been.calledWith(this.nix, this.guild3.id);
              done();
            },
            (error) => done(error)
          );
        });

        it('runs the servicesManager onNixJoinGuild for each', function (done) {
          sinon.spy(this.nix.servicesManager, 'onNixJoinGuild');

          this.nix.listen(
            () => {
              expect(this.nix.servicesManager.onNixJoinGuild).to.have.been.calledWith(this.guild1);
              expect(this.nix.servicesManager.onNixJoinGuild).to.have.been.calledWith(this.guild2);
              expect(this.nix.servicesManager.onNixJoinGuild).to.have.been.calledWith(this.guild3);
              done();
            },
            (error) => done(error)
          );
        });

        it('runs the moduleManager onNixJoinGuild for each', function (done) {
          sinon.spy(this.nix.moduleManager, 'onNixJoinGuild');

          this.nix.listen(
            () => {
              expect(this.nix.moduleManager.onNixJoinGuild).to.have.been.calledWith(this.guild1);
              expect(this.nix.moduleManager.onNixJoinGuild).to.have.been.calledWith(this.guild2);
              expect(this.nix.moduleManager.onNixJoinGuild).to.have.been.calledWith(this.guild3);
              done();
            },
            (error) => done(error)
          );
        });
      });
    });
  });

  describe('#handleHook', function () {
    context('when the hook return value is undefined', function () {
      beforeEach(function () {
        this.returnValue = undefined;
      });

      it('turns the value into an Observable', function (done) {
        let nextCallback = sinon.fake();
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(nextCallback, (error) => done(error), () => {
          expect(nextCallback).to.have.been.calledOnceWith('');
          done();
        });
      });
    });

    context('when the hook return value an observable', function () {
      beforeEach(function () {
        this.returnValue = Rx.Observable.of('response');
      });

      it('turns the value into an Observable', function (done) {
        let nextCallback = sinon.fake();
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(nextCallback, (error) => done(error), () => {
          expect(nextCallback).to.have.been.calledOnceWith('response');
          done();
        });
      });
    });

    context('when the hook return value is a promise', function () {
      beforeEach(function () {
        this.returnValue = new Promise((resolve) => resolve('response'));
      });

      it('turns the value into an Observable', function (done) {
        let nextCallback = sinon.fake();
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(nextCallback, (error) => done(error), () => {
          expect(nextCallback).to.have.been.calledOnceWith('response');
          done();
        });
      });
    });

    context('when the hook return value is an object', function () {
      beforeEach(function () {
        this.returnValue = { returned: true };
      });

      it('turns the value into an Observable', function (done) {
        let nextCallback = sinon.fake();
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(nextCallback, (error) => done(error), () => {
          expect(nextCallback).to.have.been.calledOnceWith(this.returnValue);
          done();
        });
      });
    });
  });
});
