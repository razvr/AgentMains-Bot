const Discord = require('discord.js');
const { Observable, of, EMPTY } = require('rxjs');
const { tap, flatMap, catchError, toArray } = require('rxjs/operators');

const CommandManager = require('../../lib/managers/command-manager');
const ConfigManager = require('../../lib/managers/config-manager');
const corePlugin = require('../../lib/core-plugin');
const DataManager = require('../../lib/managers/data-manager');
const ChaosCore = require('../../lib/chaos-core');
const PermissionsManager = require('../../lib/managers/permissions-manager');
const PluginManager = require('../../lib/managers/plugin-manager');
const Service = require("../../lib/models/service");
const ServicesManager = require('../../lib/managers/services-manager');
const mocks = require('../mocks');

describe('ChaosCore', function () {
  beforeEach(function () {
    this.config = {
      ownerUserId: "mock_ownerUserId",
      loginToken: "mock_loginToken",
      logger: { silent: true },
    };

    this.discord = new mocks.discord.Client({});
    this.owner = new mocks.discord.User({
      client: this.discord,
      data: {
        id: this.config.ownerUserId,
      },
    });
    this.discord.users.set(this.owner.id, this.owner);

    this.chaos = new ChaosCore(this.config);
    this.chaos.discord = this.discord;
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown()
        .subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  describe('constructor', function () {
    it('verifies the config', function () {
      this.config = { verifyConfig: sinon.fake() };

      this.chaos = new ChaosCore(this.config);
      expect(this.config.verifyConfig).to.have.been.called;
    });

    it('creates a new Discord client', function () {
      expect(this.chaos.discord).to.be.an.instanceOf(Discord.Client);
    });

    describe('creates and binds managers', function () {
      beforeEach(function () {
        this.chaos = new ChaosCore(this.config);
      });

      it('creates and binds a DataManager', function () {
        expect(this.chaos.dataManager).to.be.an.instanceOf(DataManager);
        expect(this.chaos.setGuildData).to.eq(this.chaos.dataManager.setGuildData);
        expect(this.chaos.getGuildData).to.eq(this.chaos.dataManager.getGuildData);
      });

      it('creates and binds a CommandManager', function () {
        expect(this.chaos.commandManager).to.be.an.instanceOf(CommandManager);
        expect(this.chaos.addCommand).to.eq(this.chaos.commandManager.addCommand);
        expect(this.chaos.getCommand).to.eq(this.chaos.commandManager.getCommand);
      });

      it('creates and binds a ServicesManager', function () {
        expect(this.chaos.servicesManager).to.be.an.instanceOf(ServicesManager);
        expect(this.chaos.addService).to.eq(this.chaos.servicesManager.addService);
        expect(this.chaos.getService).to.eq(this.chaos.servicesManager.getService);
      });

      it('creates and binds a PluginManager', function () {
        expect(this.chaos.pluginManager).to.be.an.instanceOf(PluginManager);
        expect(this.chaos.addPlugin).to.eq(this.chaos.pluginManager.addPlugin);
        expect(this.chaos.getPlugin).to.eq(this.chaos.pluginManager.getPlugin);
      });

      it('creates and binds a ConfigManager', function () {
        expect(this.chaos.configManager).to.be.an.instanceOf(ConfigManager);
        expect(this.chaos.addConfigAction).to.eq(this.chaos.configManager.addConfigAction);
        expect(this.chaos.getConfigAction).to.eq(this.chaos.configManager.getConfigAction);
      });

      it('creates and binds a PermissionsManager', function () {
        expect(this.chaos.permissionsManager).to.be.an.instanceOf(PermissionsManager);
        expect(this.chaos.addPermissionLevel).to.eq(this.chaos.permissionsManager.addPermissionLevel);
        expect(this.chaos.getPermissionLevel).to.eq(this.chaos.permissionsManager.getPermissionLevel);
      });
    });

    it('loads response strings from the config', function () {
      this.config.responseStrings = {
        test: () => 'test_string',
      };

      this.chaos = new ChaosCore(this.config);
      expect(this.chaos.responseStrings.test).to.eq(this.config.responseStrings.test);
    });

    it('loads the core plugin', function () {
      this.chaos = new ChaosCore(this.config);
      const loadedPlugins = this.chaos.pluginManager.plugins;
      expect(loadedPlugins.map((p) => p.name)).to.include(corePlugin.name);
    });

    it('loads plugins from the config', function () {
      this.config.plugins = [{ name: 'testPlugin' }];

      this.chaos = new ChaosCore(this.config);

      const loadedPlugins = this.chaos.pluginManager.plugins;
      expect(loadedPlugins.map((p) => p.name)).to.include('testPlugin');
    });

    it('loads services from the config', function () {
      class TestService extends Service {}

      this.config.services = { 'testPlugin': [TestService] };

      this.chaos = new ChaosCore(this.config);

      let testService = this.chaos.getService('testPlugin', 'TestService');
      expect(testService).to.be.an.instanceOf(TestService);
    });

    it('loads commands from the config', function () {
      this.config.commands = [{
        name: 'testCommand',
        run: () => {},
      }];

      this.chaos = new ChaosCore(this.config);

      expect(this.chaos.getCommand('testCommand')).not.to.be.undefined;
    });
  });

  describe('#listen', function () {
    it('returns an observable', function () {
      expect(this.chaos.listen()).to.be.an.instanceOf(Observable);
    });

    it('emits when the bot is ready', function (done) {
      this.chaos.listen().pipe(
        tap((item) => expect(item).to.eq('Ready')),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('returns the same stream for multiple calls', function () {
      let result1$ = this.chaos.listen();
      let result2$ = this.chaos.listen();

      expect(result1$).to.eq(result2$);
    });

    it('replays the ready signal', function (done) {
      this.chaos.listen().pipe(
        flatMap(() => this.chaos.listen()),
      ).subscribe(() => done(), (error) => done(error));
    });

    describe('bootstrap process', function () {
      it('triggers onListen for services', function (done) {
        sinon.spy(this.chaos.servicesManager, 'onListen');
        this.chaos.listen().pipe(
          tap(() => expect(this.chaos.servicesManager.onListen).to.have.been.calledOnce),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('triggers onListen for commands', function (done) {
        sinon.spy(this.chaos.commandManager, 'onListen');

        this.chaos.listen().pipe(
          tap(() => expect(this.chaos.commandManager.onListen).to.have.been.calledOnce),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('logs into discord', function (done) {
        this.chaos.discord.login = sinon.fake.resolves(true);
        this.chaos.listen().pipe(
          tap(() => expect(this.chaos.discord.login).to.have.been.calledWith(this.config.loginToken)),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('tries to find the owner', function (done) {
        sinon.spy(this.chaos, 'findOwner');

        this.chaos.listen().pipe(
          tap(() => expect(this.chaos.findOwner).to.have.been.calledWith()),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('triggers the onListen hook', function (done) {
        sinon.spy(this.chaos, 'onListen');

        this.chaos.listen().pipe(
          tap(() => expect(this.chaos.onListen).to.have.been.calledWith()),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('starts all Discord event streams', function (done) {
        this.chaos.listen().pipe(
          tap(() => {
            Object.values(Discord.Constants.Events).forEach((eventType) => {
              expect(this.chaos.streams[eventType + '$']).to.be.an.instanceOf(Observable);
            });
          }),
        ).subscribe(() => done(), (error) => done(error));
      });

      context('when the bot has joined guilds', function () {
        beforeEach(function () {
          this.guild1 = { id: 'mock_id_1' };
          this.guild2 = { id: 'mock_id_2' };
          this.guild3 = { id: 'mock_id_3' };
          this.chaos.discord.guilds.set(this.guild1.id, this.guild1);
          this.chaos.discord.guilds.set(this.guild2.id, this.guild2);
          this.chaos.discord.guilds.set(this.guild3.id, this.guild3);
        });

        it('runs the onJoinGuild for each', function (done) {
          sinon.spy(this.chaos, 'onJoinGuild');

          this.chaos.listen().pipe(
            tap(() => {
              expect(this.chaos.onJoinGuild).to.have.been.calledWith(this.guild1);
              expect(this.chaos.onJoinGuild).to.have.been.calledWith(this.guild2);
              expect(this.chaos.onJoinGuild).to.have.been.calledWith(this.guild3);
            }),
          ).subscribe(() => done(), (error) => done(error));
        });
      });
    });
  });

  describe('#shutdown', function () {
    context('when ChaosCore is listening', function () {
      beforeEach(function () {
        this.ready$ = this.chaos.listen();
      });

      it('stops the main listening stream', function (done) {
        this.ready$.subscribe(
          () => this.chaos.shutdown(),
          (error) => done(error),
          () => done(),
        );
      });
    });

    context('when ChaosCore is not listening', function () {
      it('throws an error', function () {
        expect(() => this.chaos.shutdown()).to.throw(
          Error, "Bot is not listening",
        );
      });
    });
  });

  describe('#messageOwner', function () {
    beforeEach(function () {
      this.message = "test_message";
    });

    it('returns an Observable', function () {
      expect(this.chaos.messageOwner(this.message)).to.be.an.instanceOf(Observable);
    });

    context('when the owner has been found', function () {
      beforeEach(function () {
        this.chaos._owner = {
          send: sinon.fake.resolves(''),
        };
      });

      it('sends the message to the owner', function (done) {
        this.chaos.messageOwner(this.message)
          .subscribe(() => {}, (error) => done(error), () => {
            expect(this.chaos.owner.send).to.have.been.calledWith(this.message);
            done();
          });
      });

      context('when options are passed as well', function () {
        beforeEach(function () {
          this.options = {};
        });

        it('sends the message and options to the owner', function (done) {
          this.chaos.messageOwner(this.message, this.options)
            .subscribe(() => {
            }, (error) => done(error), () => {
              expect(this.chaos.owner.send).to.have.been.calledWith(this.message, this.options);
              done();
            });
        });
      });
    });

    context('when the owner has not been found', function () {
      beforeEach(function () {
        this.chaos._owner = null;
      });

      it('throws an error', function (done) {
        this.chaos.messageOwner('test_message')
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

        this.chaos.discord.fetchUser = sinon.fake.rejects(this.error);
      });

      it('raises an error', function (done) {
        this.chaos.findOwner()
          .subscribe(() => done('next was called'), (error) => {
            expect(error).to.eq(this.error);
            done();
          });
      });
    });

    context('when discord raises an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.chaos.discord.fetchUser = sinon.fake.rejects(this.error);
      });

      it('raises an error', function (done) {
        this.chaos.findOwner()
          .subscribe(() => done('next was called'), (error) => {
            expect(error).to.eq(this.error);
            done();
          });
      });
    });

    context('when the owner can be found', function () {
      beforeEach(function () {
        this.user = { tag: 'mock_user' };
        this.chaos.discord.fetchUser = sinon.fake.resolves(this.user);
      });

      it('saves the user', function (done) {
        this.chaos.findOwner().subscribe(
          () => {
            expect(this.chaos.owner).to.eq(this.user);
            done();
          },
          (error) => done(error),
        );
      });
    });
  });

  describe('#handleError', function () {
    beforeEach(function () {
      this.error = new Error('mock error');
    });

    it('returns an Observable', function () {
      expect(this.chaos.handleError(this.error)).to.be.an.instanceOf(Observable);
    });

    it('messages the owner', function (done) {
      sinon.stub(this.chaos, 'messageOwner').returns(of('value'));
      let embed = this.chaos.createEmbedForError(this.error);

      this.chaos.handleError(this.error)
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.chaos.messageOwner).to.have.been.calledOnceWith(
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
      expect(this.chaos.createEmbedForError(this.error)).to.be.an.instanceOf(Discord.RichEmbed);
    });

    it('adds an Error field', function () {
      let embed = this.chaos.createEmbedForError(this.error);
      expect(Object.values(embed.fields).map((f) => f.name)).to.include('Error:');
    });

    it('adds an Stack field', function () {
      let embed = this.chaos.createEmbedForError(this.error);
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
        let embed = this.chaos.createEmbedForError(this.error, this.extraFields);
        let fields = Object.values(embed.fields);

        this.extraFields.forEach((extraField) => {
          expect(fields.map((f) => f.name)).to.include(extraField.name);
        });
      });
    });
  });

  describe('#onListen', function () {
    beforeEach(function () {
      this.chaos.streams = {
        message$: EMPTY,
      };
    });

    it('returns an Observable', function () {
      expect(this.chaos.onListen()).to.be.an.instanceOf(Observable);
    });

    it('emits true', function (done) {
      this.chaos.onListen().pipe(
        toArray(),
        tap((emitted) => expect(emitted).to.deep.equal([true])),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('runs servicesManager onListen', function (done) {
      sinon.spy(this.chaos.servicesManager, 'onListen');

      this.chaos.onListen()
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.chaos.servicesManager.onListen).to.have.been.calledOnce;
          done();
        });
    });

    it('runs pluginManager onListen', function (done) {
      sinon.spy(this.chaos.pluginManager, 'onListen');

      this.chaos.onListen()
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.chaos.pluginManager.onListen).to.have.been.calledOnce;
          done();
        });
    });

    context('when the servicesManager onListen hook throws an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.hook = sinon.fake.throws(this.error);
        this.chaos.servicesManager.onListen = this.hook;

        this.chaos.handleError = sinon.fake.returns(of(''));
      });

      it('throws the error', function (done) {
        this.chaos.onListen()
          .subscribe(() => done('next was called'), (error) => {
              expect(error).to.eq(this.error);
              done();
            },
          );
      });
    });

    context('when the pluginManager onListen hook throws an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.hook = sinon.fake.throws(this.error);
        this.chaos.pluginManager.onListen = this.hook;

        this.chaos.handleError = sinon.fake.returns(of(''));
      });

      it('throws the error', function (done) {
        this.chaos.onListen()
          .subscribe(() => done('next was called'), (error) => {
              expect(error).to.eq(this.error);
              done();
            },
          );
      });
    });
  });

  describe('#onJoinGuild', function () {
    beforeEach(function () {
      this.guild = { id: 'mock_id' };
      this.chaos.handleError = sinon.fake((error) => {
        throw error;
      });
    });

    it('returns an Observable', function () {
      expect(this.chaos.onJoinGuild(this.guild)).to.be.an.instanceOf(Observable);
    });

    it('emits true', function (done) {
      let nextCallback = sinon.fake();
      this.chaos.onJoinGuild(this.guild)
        .subscribe(nextCallback, (error) => done(error), () => {
          expect(nextCallback).to.have.been.calledOnceWith(true);
          done();
        });
    });

    it('runs dataManager onJoinGuild', function (done) {
      sinon.spy(this.chaos.dataManager, 'onJoinGuild');

      this.chaos.onJoinGuild(this.guild)
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.chaos.dataManager.onJoinGuild).to.have.been.calledOnceWith(this.guild);
          done();
        });
    });

    it('runs servicesManager onJoinGuild', function (done) {
      sinon.spy(this.chaos.servicesManager, 'onJoinGuild');

      this.chaos.onJoinGuild(this.guild)
        .subscribe(() => {}, (error) => done(error), () => {
          expect(this.chaos.servicesManager.onJoinGuild).to.have.been.calledOnceWith(this.guild);
          done();
        });
    });

    it('runs pluginManager onJoinGuild', function (done) {
      sinon.spy(this.chaos.pluginManager, 'onJoinGuild');

      this.chaos.onJoinGuild(this.guild).pipe(
        toArray(),
        tap(() => expect(this.chaos.pluginManager.onJoinGuild).to.have.been.calledOnceWith(this.guild)),
      ).subscribe(() => done(), (error) => done(error));
    });

    context('when the servicesManager onJoinGuild hook throws an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.hook = sinon.fake.throws(this.error);
        this.chaos.servicesManager.onJoinGuild = this.hook;

        this.chaos.handleError = sinon.fake.returns(of(''));
      });

      it('throws the error', function (done) {
        this.chaos.onJoinGuild(this.guild).pipe(
          catchError((error) => {
            expect(error).to.eq(this.error);
            return EMPTY;
          }),
        ).subscribe(() => done(new Error('No error was raised')), done, done);
      });
    });

    context('when the pluginManager onListen hook throws an error', function () {
      beforeEach(function () {
        this.error = new Error('mock error');
        this.hook = sinon.fake.throws(this.error);
        this.chaos.pluginManager.onJoinGuild = this.hook;

        this.chaos.handleError = sinon.fake.returns(of(''));
      });

      it('throws the error', function (done) {
        this.chaos.onJoinGuild(this.guild)
          .subscribe(() => done('next was called'), (error) => {
              expect(error).to.eq(this.error);
              done();
            },
          );
      });
    });
  });
});
