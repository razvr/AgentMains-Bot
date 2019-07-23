const { tap } = require('rxjs/operators');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.cmdEnabled?', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'cmdEnabled?');
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

  describe('!config core cmdEnabled?', function () {
    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');

      this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'cmdEnabled?',
        message: this.message,
      }).pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'cmdEnabled?',
        message: this.message,
      }).pipe(
        tap((response) => expect(response).to.containSubset({
          content: "I'm sorry, but I'm missing some information for that command:",
          embed: {
            title: "cmdEnabled?",
            description: "check if a command is enabled",
            fields: [
              {
                name: "Usage",
                value: `!config core cmdEnabled? <command>`,
              },
              {
                name: "Args",
                value: "**command**: The name of the command to check",
              },
            ],
          },
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config core cmdEnabled? {command}', function () {
    beforeEach(function () {
      this.chaos.addCommand('test', {
        name: "testCommand",
      });
    });

    context('when the plugin is disabled', function () {
      it('responds that the plugin is disabled', function (done) {
        this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'cmdEnabled?',
          message: this.message,
          args: { command: 'testCommand' },
        }).pipe(
          tap((response) => expect(response).to.containSubset({
            content: "Plugin test is disabled.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the plugin is enabled', function () {
      beforeEach(function (done) {
        const PluginService = this.chaos.getService('core', 'PluginService');
        PluginService.enablePlugin(this.message.guild.id, 'test')
          .subscribe(() => done(), (error) => done(error));
      });

      context('when the command is enabled', function () {
        it('responds that the command is enabled', function (done) {
          this.chaos.testConfigAction({
            pluginName: 'core',
            actionName: 'cmdEnabled?',
            message: this.message,
            args: { command: 'testCommand' },
          }).pipe(
            tap((response) => expect(response).to.containSubset({
              content: "command testCommand is enabled.",
            })),
          ).subscribe(() => done(), (error) => done(error));
        });
      });

      context('when the command is disabled', function () {
        beforeEach(function (done) {
          this.chaos.getService('core', 'CommandService')
            .disableCommand(this.message.guild.id, 'testCommand')
            .subscribe(() => done(), (error) => done(error));
        });

        it('responds that the command is disabled', function (done) {
          this.chaos.testConfigAction({
            pluginName: 'core',
            actionName: 'cmdEnabled?',
            message: this.message,
            args: { command: 'testCommand' },
          }).pipe(
            tap((response) => expect(response).to.containSubset({
              content: "command testCommand is disabled.",
            })),
          ).subscribe(() => done(), (error) => done(error));
        });
      });
    });
  });
});
