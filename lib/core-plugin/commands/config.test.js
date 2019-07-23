const { tap } = require('rxjs/operators/index');

const createChaosStub = require('../../test/create-chaos-stub');
const { MockMessage } = require('../../test/mocks/discord.mocks');

describe('Command: !config', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.command = this.chaos.getCommand('config');
    this.message = new MockMessage();

    this.chaos.addPlugin({
      name: "test",
      configActions: [
        { name: "action1" },
        { name: "action2" },
        { name: "action3" },
      ],
    });
  });

  context('when the user is not an admin', function () {
    it('does not run the command', function (done) {
      sinon.spy(this.command, 'run');

      this.chaos.testCommand({
        pluginName: 'core',
        commandName: 'config',
      }).pipe(
        tap(() => expect(this.command.run).not.to.have.been.called),
        tap((response) => expect(response.replies).to.have.length(0)),
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
      it('replies with the command usage', function (done) {
        this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'config',
          message: this.message,
        }).pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
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
      it('replies with a list of available config actions in all plugins', function (done) {
        const coreActions = this.chaos.configManager.actions
          .filter((action) => action.pluginName === "core")
          .map((action) => action.name);

        this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'config',
          message: this.message,
          flags: { list: true },
        }).pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
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
      it('replies with the command usage', function (done) {
        this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'config',
          message: this.message,
          args: { plugin: 'test' },
        }).pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
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
      it('replies with a list of available config actions in the given plugin', function (done) {
        this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'config',
          message: this.message,
          args: { plugin: 'test' },
          flags: { list: true },
        }).pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
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
        this.action = this.chaos.getConfigAction('test', 'action1');
      });

      context('when the plugin is disabled', function () {
        it('gives an error message', function (done) {
          sinon.spy(this.action, 'run');

          this.chaos.testCommand({
            pluginName: 'core',
            commandName: 'config',
            message: this.message,
            args: { plugin: 'test', action: 'action1' },
          }).pipe(
            tap(() => expect(this.action.run).not.to.have.been.called),
            tap((response) => expect(response.replies).to.have.length(1)),
            tap((response) => expect(response.replies[0]).to.containSubset({
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

          this.chaos.testCommand({
            pluginName: 'core',
            commandName: 'config',
            message: this.message,
            args: { plugin: 'test', action: 'action1' },
          }).pipe(
            tap((response) => {
              expect(this.action.run).to.have.been.called;
              expect(response.replies).to.have.length(0);
            }),
          ).subscribe(() => done(), (error) => done(error));
        });
      });
    });
  });
});
