const { tap } = require('rxjs/operators');

const createChaosStub = require('../../../create-chaos-stub');
const { MockMessage } = require("../../../mocks/discord.mocks");

describe('Command: !config', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.command = this.chaos.getCommand('config');
    this.message = new MockMessage({});

    this.chaos.addPlugin({
      name: "test",
      configActions: [
        { name: "action1" },
        { name: "action2" },
        { name: "action3" },
      ],
    });

    this.chaos.listen().subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  context('when the user is not an admin', function () {
    it('does not run the command', function (done) {
      this.message.content = '!config';
      sinon.spy(this.command, 'run');

      this.chaos.testCmdMessage(this.message).pipe(
        tap(() => expect(this.command.run).not.to.have.been.called),
        tap(({ response }) => expect(response.replies).to.have.length(0)),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the user is an admin', function () {
    beforeEach(function (done) {
      const permissionsService = this.chaos.getService('core', 'PermissionsService');
      permissionsService.addUser(this.message.guild, 'admin', this.message.author)
        .subscribe(() => done(), (error) => done(error));
    });

    describe('!config', function () {
      beforeEach(function () {
        this.message.content = '!config';
      });

      it('replies with the command usage', function (done) {
        sinon.spy(this.command, 'run');

        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "I'm sorry, but I'm missing some information for that command:",
            embed: {
              fields: [
                {
                  "name": "Usage",
                  "value": "!config [--list] <plugin> <action>",
                },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    describe('!config --list', function () {
      beforeEach(function () {
        this.message.content = '!config --list';
      });

      it('replies with a list of available config actions in all plugins', function (done) {
        sinon.spy(this.command, 'run');

        const coreActions = this.chaos.configManager.actions
          .filter((action) => action.pluginName === "core")
          .map((action) => action.name);

        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "Here's a list of plugins with config actions:",
            embed: {
              fields: [
                { name: "core", value: coreActions.join(', ') },
                { name: "test", value: 'action1, action2, action3' },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    describe('!config {plugin}', function () {
      beforeEach(function () {
        this.message.content = '!config test';
      });

      it('replies with the command usage', function (done) {
        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "I'm sorry, but I'm missing some information for that command:",
            embed: {
              fields: [
                { name: "Usage", value: "!config [--list] <plugin> <action>" },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    describe('!config {plugin} --list', function () {
      beforeEach(function () {
        this.message.content = '!config test --list';
      });

      it('replies with a list of available config actions in the given plugin', function (done) {
        sinon.spy(this.command, 'run');

        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "Here's a list of config actions for test:",
            embed: {
              "fields": [
                { name: "action1", value: "*Usage*:\n\t!config test action1" },
                { name: "action2", value: "*Usage*:\n\t!config test action2" },
                { name: "action3", value: "*Usage*:\n\t!config test action3" },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    describe('!config {plugin} {action}', function () {
      beforeEach(function () {
        this.message.content = '!config test action1';
        this.action = this.chaos.getConfigAction('test', 'action1');
      });

      context('when the plugin is disabled', function () {
        it('gives an error message', function (done) {
          sinon.spy(this.action, 'run');

          this.chaos.testCmdMessage(this.message).pipe(
            tap(() => expect(this.action.run).not.to.have.been.called),
            tap(({ response }) => expect(response.replies).to.have.length(1)),
            tap(({ response }) => expect(response.replies[0]).to.containSubset({
              content:
                "The plugin \"test\" is currently disabled.\n" +
                "You can use `!config core enablePlugin test` to enable it.",
            })),
          ).subscribe(() => done(), (error) => done(error));
        });
      });

      context('when the plugin is enabled', function () {
        beforeEach(function (done) {
          this.chaos.getService('core', 'PluginService')
            .enablePlugin(this.message.guild.id, 'test')
            .subscribe(() => done(), (error) => done(error));
        });

        it('runs a config action', function (done) {
          sinon.spy(this.action, 'run');

          this.chaos.testCmdMessage(this.message).pipe(
            tap(() => expect(this.action.run).to.have.been.called),
            tap(({ response }) => expect(response.replies).to.have.length(0)),
          ).subscribe(() => done(), (error) => done(error));
        });
      });
    });
  });
});
