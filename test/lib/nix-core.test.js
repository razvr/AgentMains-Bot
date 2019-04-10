const Rx = require('rx');
const Discord = require('discord.js');

const Nix = require('../../lib/nix-core');
const DataManager = require('../../lib/managers/data-manager');
const CommandManager = require('../../lib/managers/command-manager');
const ServicesManager = require('../../lib/managers/services-manager');
const PluginManager = require('../../lib/managers/plugin-manager');
const ConfigManager = require('../../lib/managers/config-manager');
const PermissionsManager = require('../../lib/managers/permissions-manager');

describe('Nix', function () {
  beforeEach(function () {
    this.config = {
      ownerUserId: "mock_ownerUserId",
      loginToken: "mock_loginToken",
      logger: { silent: true },
    };

    this.discord = Mockery.create("Client");
    this.owner = Mockery.create('User', {
      client: this.discord,
      id: this.config.ownerUserId,
    });

    this.nix = new Nix(this.config);
    this.nix.discord = this.discord;
  });

  afterEach(function (done) {
    if (this.nix.listening) {
      this.nix.shutdown()
        .subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  describe('constructor', function () {
    beforeEach(function () {
      sinon.stub(CommandManager.prototype, 'loadCommands');
      sinon.stub(ServicesManager.prototype, 'loadServices');
      sinon.stub(PluginManager.prototype, 'loadPlugins');

      this.nix = new Nix(this.config);
    });

    afterEach(function () {
      CommandManager.prototype.loadCommands.restore();
      ServicesManager.prototype.loadServices.restore();
      PluginManager.prototype.loadPlugins.restore();
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

    it('creates and binds a PluginManager', function () {
      expect(this.nix.pluginManager).to.be.an.instanceOf(PluginManager);
      expect(this.nix.addPlugin).to.eq(this.nix.pluginManager.addPlugin);
      expect(this.nix.getPlugin).to.eq(this.nix.pluginManager.getPlugin);
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

    it('triggers the loading of plugins', function () {
      expect(this.nix.pluginManager.loadPlugins).to.have.been.called;
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
    it('returns an observable', function () {
      expect(this.nix.listen()).to.be.an.instanceOf(Rx.Observable);
    });

    it('emits when the bot is ready', function (done) {
      this.nix.listen()
        .do((item) => expect(item).to.eq('Ready'))
        .subscribe(() => done(), (error) => done(error));
    });

    it('returns the same stream for multiple calls', function () {
      let result1$ = this.nix.listen();
      let result2$ = this.nix.listen();

      expect(result1$).to.eq(result2$);
    });

    it('replays the ready signal', function (done) {
      this.nix.listen()
        .flatMap(() => this.nix.listen())
        .subscribe(() => done(), (error) => done(error));
    });

    describe('bootstrap process', function () {
      it('configures services', function (done) {
        sinon.spy(this.nix.servicesManager, 'configureServices');
        this.nix.listen()
          .do(() => expect(this.nix.servicesManager.configureServices).to.have.been.called)
          .subscribe(() => done(), (error) => done(error));
      });

      context('when configuring services fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.servicesManager, 'configureServices').throws(this.error);
        });

        it('triggers the error callback', function (done) {
          this.nix.listen()
            .subscribe(
              () => done(new Error("Error callback was not called")),
              () => done(),
            );
        });
      });

      it('configures commands', function (done) {
        sinon.spy(this.nix.commandManager, 'configureCommands');

        this.nix.listen()
          .do(() => expect(this.nix.commandManager.configureCommands).to.have.been.called)
          .subscribe(() => done(), (error) => done(error));
      });

      context('when configuring commands fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix.commandManager, 'configureCommands').throws(this.error);
        });

        it('triggers the error callback', function (done) {
          this.nix.listen()
            .subscribe(
              () => done(new Error("Error callback was not called")),
              () => done(),
            );
        });
      });

      it('logs into discord', function (done) {
        this.nix.listen()
          .do(() => expect(this.nix.discord.login).to.have.been.calledWith(this.config.loginToken))
          .subscribe(() => done(), (error) => done(error));
      });

      context('when logging into discord fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          this.nix.discord.login = fake.rejects(this.error);
        });

        it('triggers the error callback', function (done) {
          this.nix.listen()
            .subscribe(
              () => done(new Error("Error callback was not called")),
              () => done(),
            );
        });
      });

      it('tries to find the owner', function (done) {
        sinon.spy(this.nix, 'findOwner');

        this.nix.listen()
          .do(() => expect(this.nix.findOwner).to.have.been.calledWith())
          .subscribe(() => done(), (error) => done(error));
      });

      context('when finding the owner into discord fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix, 'findOwner').returns(Rx.Observable.throw(this.error));
        });

        it('triggers the error callback', function (done) {
          this.nix.listen()
            .subscribe(
              () => done(new Error("Error callback was not called")),
              () => done(),
            );
        });
      });

      it('triggers the onNixListen hook', function (done) {
        sinon.spy(this.nix, 'onNixListen');

        this.nix.listen()
          .do(() => expect(this.nix.onNixListen).to.have.been.calledWith())
          .subscribe(() => done(), (error) => done(error));
      });

      context('when the onNixListen hook fails', function () {
        beforeEach(function () {
          this.error = new Error("mock error");
          sinon.stub(this.nix, 'onNixListen').returns(Rx.Observable.throw(this.error));
        });

        it('triggers the error callback', function (done) {
          this.nix.listen()
            .subscribe(
              () => done(new Error("Error callback was not called")),
              () => done(),
            );
        });
      });

      it('starts all Discord event streams', function (done) {
        this.nix.listen()
          .do(() => {
            Object.values(Discord.Constants.Events).forEach((eventType) => {
              expect(this.nix.streams[eventType + '$']).to.be.an.instanceOf(Rx.Observable);
            });
          })
          .subscribe(() => done(), (error) => done(error));
      });

      it('starts nix related event streams', function (done) {
        this.nix.listen()
          .do(() => expect(this.nix.streams.command$).to.be.an.instanceOf(Rx.Observable))
          .subscribe(() => done(), (error) => done(error));
      });

      context('when the bot has joined guilds', function () {
        beforeEach(function () {
          this.guild1 = { id: 'mock_id_1' };
          this.guild2 = { id: 'mock_id_2' };
          this.guild3 = { id: 'mock_id_3' };
          this.nix.discord.guilds.set(this.guild1.id, this.guild1);
          this.nix.discord.guilds.set(this.guild2.id, this.guild2);
          this.nix.discord.guilds.set(this.guild3.id, this.guild3);
        });

        it('runs the onNixJoinGuild for each', function (done) {
          sinon.spy(this.nix, 'onNixJoinGuild');

          this.nix.listen()
            .do(() => {
              expect(this.nix.onNixJoinGuild).to.have.been.calledWith(this.guild1);
              expect(this.nix.onNixJoinGuild).to.have.been.calledWith(this.guild2);
              expect(this.nix.onNixJoinGuild).to.have.been.calledWith(this.guild3);
            })
            .subscribe(() => done(), (error) => done(error));
        });
      });
    });
  });

  describe('#shutdown', function () {
    context('when nix is listening', function () {
      beforeEach(function () {
        this.ready$ = this.nix.listen();
      });

      it('stops the main listening stream', function (done) {
        this.ready$.subscribe(
          () => this.nix.shutdown(),
          (error) => done(error),
          () => done(),
        );
      });
    });

    context('when nix is not listening', function () {
      it('throws an error', function () {
        expect(() => this.nix.shutdown()).to.throw(
          Error, "Bot is not listening",
        );
      });
    });
  });

  describe('#messageOwner', function () {
    before(function () {
      this.message = "test_message";
    });

    it('returns an Observable', function () {
      expect(this.nix.messageOwner(this.message)).to.be.an.instanceOf(Rx.Observable);
    });

    context('when the owner has been found', function () {
      beforeEach(function () {
        this.nix._owner = {
          send: sinon.fake.resolves(''),
        };
      });

      it('sends the message to the owner', function (done) {
        this.nix.messageOwner(this.message)
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.nix.owner.send).to.have.been.calledWith(this.message);
            done();
          });
      });

      context('when options are passed as well', function () {
        beforeEach(function () {
          this.options = {};
        });

        it('sends the message and options to the owner', function (done) {
          this.nix.messageOwner(this.message, this.options)
            .subscribe(() => {
            }, (error) => done(error), () => {
              expect(this.nix.owner.send).to.have.been.calledWith(this.message, this.options);
              done();
            });
        });
      });
    });

    context('when the owner has not been found', function () {
      beforeEach(function () {
        this.nix._owner = null;
      });

      it('throws an error', function (done) {
        this.nix.messageOwner('test_message')
          .subscribe(() => done('next was called'), (error) => {
            expect(error).to.be.an.instanceOf(Error).with.property('message', 'Owner was not found.');
            done();
          });
      });
    });
  });

  describe('#findOwner', function () {
    context('when the owner can not be found', function () {
      beforeEach(function () {
        this.error = new Error('Unknown User');
        this.error.name = 'DiscordAPIError';

        this.nix.discord.fetchUser = sinon.fake.rejects(this.error);
      });

      it('raises an error', function (done) {
        this.nix.findOwner()
          .subscribe(() => done('next was called'), (error) => {
            expect(error).to.eq(this.error);
            done();
          });
      });
    });

    context('when discord raises an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.nix.discord.fetchUser = sinon.fake.rejects(this.error);
      });

      it('raises an error', function (done) {
        this.nix.findOwner()
          .subscribe(() => done('next was called'), (error) => {
            expect(error).to.eq(this.error);
            done();
          });
      });
    });

    context('when the owner can be found', function () {
      beforeEach(function () {
        this.user = { tag: 'mock_user' };
        this.nix.discord.fetchUser = sinon.fake.resolves(this.user);
      });

      it('saves the user', function (done) {
        this.nix.findOwner().subscribe(
          () => {
            expect(this.nix.owner).to.eq(this.user);
            done();
          },
          (error) => done(error),
        );
      });
    });
  });

  describe('#runHook', function () {
    beforeEach(function () {
      this.hookListener = {};
      this.hookName = 'onTest';
    });

    context('when the hookListener does not have the hook', function () {
      beforeEach(function () {
        delete this.hookListener[this.hookName];
      });

      it('returns an Observable', function () {
        expect(this.nix.runHook(this.hookListener, this.hookName)).to.be.an.instanceOf(Rx.Observable);
      });

      it('returns emits true', function (done) {
        let nextCallback = sinon.fake();
        this.nix.runHook(this.hookListener, this.hookName)
          .subscribe(nextCallback, (error) => done(error), () => {
            expect(nextCallback).to.have.been.calledOnceWith(true);
            done();
          });
      });
    });

    context('when the hookListener does have the hook', function () {
      beforeEach(function () {
        this.returnValue = {};
        this.hook = sinon.fake.returns(this.returnValue);
        this.hookListener[this.hookName] = this.hook;
      });

      it('returns an Observable', function () {
        expect(this.nix.runHook(this.hookListener, this.hookName)).to.be.an.instanceOf(Rx.Observable);
      });

      it('runs the hook', function (done) {
        this.nix.runHook(this.hookListener, this.hookName)
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.hook).to.have.been.calledOnce;
            done();
          });
      });

      it('emits true', function (done) {
        let nextCallback = sinon.fake();
        this.nix.runHook(this.hookListener, this.hookName)
          .subscribe(nextCallback, (error) => done(error), () => {
            expect(nextCallback).to.have.been.calledOnceWith(true);
            done();
          });
      });

      context('when arguments are passed', function () {
        beforeEach(function () {
          this.args = ['arg1', 'arg2', 'arg3'];
        });

        it('runs the hook with the passed args', function (done) {
          this.nix.runHook(this.hookListener, this.hookName, this.args)
            .subscribe(() => {}, (error) => done(error), () => {
              expect(this.hook).to.have.been.calledOnceWith('arg1', 'arg2', 'arg3');
              done();
            });
        });
      });

      context('when the hook does throw an error', function () {
        beforeEach(function () {
          this.error = new Error('mock error');
          this.hook = sinon.fake.throws(this.error);
          this.hookListener[this.hookName] = this.hook;

          this.nix.handleError = sinon.fake.returns(Rx.Observable.of(''));
        });

        it('runs handleError', function (done) {
          this.nix.runHook(this.hookListener, this.hookName)
            .subscribe(() => {}, (error) => done(error), () => {
              expect(this.nix.handleError).to.have.been.calledOnceWith(this.error);
              done();
            });
        });

        context('when raiseError is true', function () {
          beforeEach(function () {
            this.args = [];
            this.raiseError = true;
          });

          it('re-throws the error', function (done) {
            this.nix.runHook(this.hookListener, this.hookName, this.args, this.raiseError)
              .subscribe(() => done('next was called'), (error) => {
                  expect(error).to.eq(this.error);
                  done();
                },
              );
          });
        });
      });
    });
  });

  describe('#handleError', function () {
    beforeEach(function () {
      this.error = new Error('mock error');
    });

    it('returns an Observable', function () {
      expect(this.nix.handleError(this.error)).to.be.an.instanceOf(Rx.Observable);
    });

    it('messages the owner', function (done) {
      sinon.stub(this.nix, 'messageOwner').returns(Rx.Observable.of('value'));
      let embed = this.nix.createEmbedForError(this.error);

      this.nix.handleError(this.error)
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.nix.messageOwner).to.have.been.calledOnceWith(
            "I ran into an unhandled exception:", { embed },
          );
          done();
        });
    });
  });

  describe('#createEmbedForError', function () {
    beforeEach(function () {
      this.error = new Error('mock error');
    });

    it('returns an RichEmbed', function () {
      expect(this.nix.createEmbedForError(this.error)).to.be.an.instanceOf(Discord.RichEmbed);
    });

    it('adds an Error field', function () {
      let embed = this.nix.createEmbedForError(this.error);
      expect(Object.values(embed.fields).map((f) => f.name)).to.include('Error:');
    });

    it('adds an Stack field', function () {
      let embed = this.nix.createEmbedForError(this.error);
      expect(Object.values(embed.fields).map((f) => f.name)).to.include('Stack:');
    });

    context('when extra fields are passed', function () {
      beforeEach(function () {
        this.extraFields = [
          { name: 'test1', value: 'value1' },
          { name: 'test2', value: 'value2' },
          { name: 'test3', value: 'value3' },
        ];
      });

      it('adds the extra fields', function () {
        let embed = this.nix.createEmbedForError(this.error, this.extraFields);
        let fields = Object.values(embed.fields);

        this.extraFields.forEach((extraField) => {
          expect(fields.map((f) => f.name)).to.include(extraField.name);
        });
      });
    });
  });

  describe('#onNixListen', function () {
    it('returns an Observable', function () {
      expect(this.nix.onNixListen()).to.be.an.instanceOf(Rx.Observable);
    });

    it('emits true', function (done) {
      let nextCallback = sinon.fake();
      this.nix.onNixListen()
        .subscribe(nextCallback, (error) => done(error), () => {
          expect(nextCallback).to.have.been.calledOnceWith(true);
          done();
        });
    });

    it('runs servicesManager onNixListen', function (done) {
      sinon.spy(this.nix.servicesManager, 'onNixListen');

      this.nix.onNixListen()
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.nix.servicesManager.onNixListen).to.have.been.calledOnce;
          done();
        });
    });

    it('runs pluginManager onNixListen', function (done) {
      sinon.spy(this.nix.pluginManager, 'onNixListen');

      this.nix.onNixListen()
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.nix.pluginManager.onNixListen).to.have.been.calledOnce;
          done();
        });
    });

    context('when the servicesManager onNixListen hook throws an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.hook = sinon.fake.throws(this.error);
        this.nix.servicesManager.onNixListen = this.hook;

        this.nix.handleError = sinon.fake.returns(Rx.Observable.of(''));
      });

      it('throws the error', function (done) {
        this.nix.onNixListen()
          .subscribe(() => done('next was called'), (error) => {
              expect(error).to.eq(this.error);
              done();
            },
          );
      });
    });

    context('when the pluginManager onNixListen hook throws an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.hook = sinon.fake.throws(this.error);
        this.nix.pluginManager.onNixListen = this.hook;

        this.nix.handleError = sinon.fake.returns(Rx.Observable.of(''));
      });

      it('throws the error', function (done) {
        this.nix.onNixListen()
          .subscribe(() => done('next was called'), (error) => {
              expect(error).to.eq(this.error);
              done();
            },
          );
      });
    });
  });

  describe('#onNixJoinGuild', function () {
    beforeEach(function (done) {
      this.guild = { id: 'mock_id' };
      this.nix.handleError = sinon.fake((error) => {
        throw error;
      });

      this.nix.servicesManager.configureServices()
        .subscribe(() => {}, (error) => done(error), () => done());
    });

    it('returns an Observable', function () {
      expect(this.nix.onNixJoinGuild(this.guild)).to.be.an.instanceOf(Rx.Observable);
    });

    it('emits true', function (done) {
      let nextCallback = sinon.fake();
      this.nix.onNixJoinGuild(this.guild)
        .subscribe(nextCallback, (error) => done(error), () => {
          expect(nextCallback).to.have.been.calledOnceWith(true);
          done();
        });
    });

    it('runs dataManager onNixJoinGuild', function (done) {
      sinon.spy(this.nix.dataManager, 'onNixJoinGuild');

      this.nix.onNixJoinGuild(this.guild)
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.nix.dataManager.onNixJoinGuild).to.have.been.calledOnceWith(this.guild);
          done();
        });
    });

    it('runs pluginService prepareDefaultData', function (done) {
      let pluginService = this.nix.getService('core', 'pluginService');
      sinon.spy(pluginService, 'prepareDefaultData');

      this.nix.onNixJoinGuild(this.guild)
        .subscribe(() => {}, (error) => done(error), () => {
          expect(pluginService.prepareDefaultData).to.have.been.calledOnceWith(this.nix, this.guild.id);
          done();
        });
    });

    it('runs servicesManager onNixJoinGuild', function (done) {
      sinon.spy(this.nix.servicesManager, 'onNixJoinGuild');

      this.nix.onNixJoinGuild(this.guild)
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.nix.servicesManager.onNixJoinGuild).to.have.been.calledOnceWith(this.guild);
          done();
        });
    });

    it('runs pluginManager onNixJoinGuild', function (done) {
      sinon.spy(this.nix.pluginManager, 'onNixJoinGuild');

      this.nix.onNixJoinGuild(this.guild)
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.nix.pluginManager.onNixJoinGuild).to.have.been.calledOnceWith(this.guild);
          done();
        });
    });

    context('when the servicesManager onNixJoinGuild hook throws an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.hook = sinon.fake.throws(this.error);
        this.nix.servicesManager.onNixJoinGuild = this.hook;

        this.nix.handleError = sinon.fake.returns(Rx.Observable.of(''));
      });

      it('throws the error', function (done) {
        this.nix.onNixJoinGuild(this.guild)
          .subscribe(() => done('next was called'), (error) => {
              expect(error).to.eq(this.error);
              done();
            },
          );
      });
    });

    context('when the pluginManager onNixListen hook throws an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.hook = sinon.fake.throws(this.error);
        this.nix.pluginManager.onNixJoinGuild = this.hook;

        this.nix.handleError = sinon.fake.returns(Rx.Observable.of(''));
      });

      it('throws the error', function (done) {
        this.nix.onNixJoinGuild(this.guild)
          .subscribe(() => done('next was called'), (error) => {
              expect(error).to.eq(this.error);
              done();
            },
          );
      });
    });
  });
});
