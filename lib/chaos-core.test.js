const Discord = require('discord.js');
const { Observable, of } = require('rxjs');
const { tap, flatMap, toArray } = require('rxjs/operators');

const CommandManager = require('./managers/command-manager');
const ConfigManager = require('./managers/config-manager');
const CorePlugin = require('./core-plugin');
const DataManager = require('./managers/data-manager');
const ChaosCore = require('./chaos-core');
const ChaosConfig = require('./models/chaos-config');
const PermissionsManager = require('./managers/permissions-manager');
const PluginManager = require('./managers/plugin-manager');
const ServicesManager = require('./managers/services-manager');
const { MockGuild, MockClient, MockUser } = require("./test/mocks/discord.mocks");

describe('ChaosCore', function () {
  beforeEach(function () {
    this.config = new ChaosConfig({
      ownerUserId: "mock_ownerUserId",
      loginToken: "mock_loginToken",
      logger: { silent: true },
    });

    this.discord = new MockClient();
    this.owner = new MockUser({
      client: this.discord,
      id: this.config.ownerUserId,
    });

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
      sinon.spy(this.config, 'verifyConfig');

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

    it('loads strings from the config', function () {
      this.config.strings = {
        test: () => 'test_string',
      };

      this.chaos = new ChaosCore(this.config);
      expect(this.chaos.strings.test).to.eq(this.config.strings.test);
    });

    it('loads the core plugin', function () {
      this.chaos = new ChaosCore(this.config);
      expect(this.chaos.getPlugin('core')).to.be.an.instanceOf(CorePlugin);
    });

    it('loads plugins from the config', function () {
      this.config.plugins = [{ name: 'testPlugin' }];

      this.chaos = new ChaosCore(this.config);

      const loadedPlugins = this.chaos.pluginManager.plugins;
      expect(loadedPlugins.map((p) => p.name)).to.include('testPlugin');
    });
  });

  describe("#applyStrings", function () {
    it('merges strings into chaos#strings', function () {
      this.chaos.applyStrings({ test: "testing" });
      expect(this.chaos.strings.test).to.equal("testing");
    });
  });

  describe('#listen', function () {
    it('returns an observable', function () {
      expect(this.chaos.listen()).to.be.an.instanceOf(Observable);
    });

    it('emits event in the correct order', function (done) {
      const startupHandler = sinon.fake();
      const listenHandler = sinon.fake();
      const readyHandler = sinon.fake();
      const guildCreateHandler = sinon.fake();

      this.chaos.on('chaos.startup', startupHandler);
      this.chaos.on('chaos.listen', listenHandler);
      this.chaos.on('chaos.ready', readyHandler);
      this.chaos.on('guildCreate', guildCreateHandler);

      // create a mock guild to trigger the startup guildCreate event
      this.guild1 = new MockGuild({ client: this.chaos.discord });

      this.chaos.listen().pipe(
        toArray(),
        tap(() => expect(startupHandler).to.have.been.called),
        tap(() => expect(listenHandler).to.have.been.calledAfter(startupHandler)),
        tap(() => expect(guildCreateHandler).to.have.been.calledAfter(listenHandler)),
        tap(() => expect(readyHandler).to.have.been.calledAfter(guildCreateHandler)),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('emits when the bot is ready', function (done) {
      this.chaos.listen().pipe(
        toArray(),
        tap((emitted) => expect(emitted).to.deep.eq(['Ready'])),
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
        toArray(),
        tap((emitted) => expect(emitted).to.deep.eq(['Ready'])),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('does not duplicate the startup process', function (done) {
      const startupHandler = sinon.fake();
      this.chaos.on('chaos.startup', startupHandler);

      this.chaos.listen().pipe(
        flatMap(() => this.chaos.listen()),
        toArray(),
        tap(() => expect(startupHandler).to.have.been.calledOnce),
      ).subscribe(() => done(), (error) => done(error));
    });

    describe('bootstrap process', function () {
      it('logs into discord', function (done) {
        this.chaos.discord.login = sinon.fake.resolves(true);
        this.chaos.listen().pipe(
          toArray(),
          tap(() => expect(this.chaos.discord.login).to.have.been.calledWith(this.config.loginToken)),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('tries to find the owner', function (done) {
        sinon.spy(this.chaos, 'findOwner');

        this.chaos.listen().pipe(
          toArray(),
          tap(() => expect(this.chaos.findOwner).to.have.been.calledWith()),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('emits an chaos.listen event', function (done) {
        const handler = sinon.fake();
        this.chaos.on('chaos.listen', handler);

        this.chaos.listen().pipe(
          toArray(),
          tap(() => expect(handler).to.have.been.calledOnce),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('starts all Discord event streams', function (done) {
        this.chaos.listen().pipe(
          toArray(),
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

        it('emits guildCreate for each', function (done) {
          let eventHook = sinon.fake();
          this.chaos.on('guildCreate', eventHook);

          this.chaos.listen().pipe(
            toArray(),
            tap(() => expect(eventHook).to.have.been.calledWith(this.guild1)),
            tap(() => expect(eventHook).to.have.been.calledWith(this.guild2)),
            tap(() => expect(eventHook).to.have.been.calledWith(this.guild3)),
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
});
