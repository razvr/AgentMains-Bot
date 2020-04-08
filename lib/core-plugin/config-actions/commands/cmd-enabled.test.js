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
    it('does not run the action', async function () {
      sinon.spy(this.action, 'run');

      await this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'cmdEnabled?',
        message: this.message,
      }).toPromise();

      expect(this.action.run).not.to.have.been.called;
    });

    it('displays a help message', async function () {
      let response = await this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'cmdEnabled?',
        message: this.message,
      }).toPromise();

      expect(response).to.containSubset({
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
      });
    });
  });

  describe('!config core cmdEnabled? {command}', function () {
    beforeEach(function () {
      this.chaos.addCommand('test', {
        name: "testCommand",
      });
    });

    context('when the plugin is disabled', function () {
      it('responds that the plugin is disabled', async function () {
        let response = await this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'cmdEnabled?',
          message: this.message,
          args: { command: 'testCommand' },
        }).toPromise();

        expect(response).to.containSubset({
          content: "Plugin test is disabled.",
        });
      });
    });

    context('when the plugin is enabled', function () {
      beforeEach(async function () {
        const PluginService = this.chaos.getService('core', 'PluginService');
        await PluginService.enablePlugin(this.message.guild.id, 'test')
          .toPromise();
      });

      context('when the command is enabled', function () {
        it('responds that the command is enabled', async function () {
          let response = await this.chaos.testConfigAction({
            pluginName: 'core',
            actionName: 'cmdEnabled?',
            message: this.message,
            args: { command: 'testCommand' },
          }).toPromise();

          expect(response).to.containSubset({
            content: "Command `testCommand` is enabled.",
          });
        });
      });

      context('when the command is disabled', function () {
        beforeEach(async function () {
          await this.chaos.getService('core', 'CommandService')
            .disableCommand(this.message.guild.id, 'testCommand');
        });

        it('responds that the command is disabled', async function () {
          let response = await this.chaos.testConfigAction({
            pluginName: 'core',
            actionName: 'cmdEnabled?',
            message: this.message,
            args: { command: 'testCommand' },
          }).toPromise();

          expect(response).to.containSubset({
            content: "Command `testCommand` is disabled.",
          });
        });
      });
    });
  });
});
