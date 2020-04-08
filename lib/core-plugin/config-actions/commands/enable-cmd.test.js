const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.enableCmd', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'enableCmd');
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

  describe('!config core enableCmd', function () {
    it('does not run the action', async function () {
      sinon.spy(this.action, 'run');

      await this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'enableCmd',
        message: this.message,
      }).toPromise();
      expect(this.action.run).not.to.have.been.called;
    });

    it('displays a help message', async function () {
      let response = await this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'enableCmd',
        message: this.message,
      }).toPromise();

      expect(response).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
        embed: {
          title: "enableCmd",
          description: "Enable a command. Does not override disabled plugins.",
          fields: [
            {
              name: "Usage",
              value: `!config core enableCmd <command>`,
            },
            {
              name: "Args",
              value: "**command**: The name of the command to enable",
            },
          ],
        },
      });
    });
  });

  describe('!config core enableCmd {command}', function () {
    beforeEach(function () {
      this.chaos.addCommand('test', {
        name: "testCommand",
      });

      this.message.content = '!config core enableCmd testCommand';
    });

    context('when the command is enabled', function () {
      it('responds that the command was already enabled', async function () {
        let response = await this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'enableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).toPromise();

        expect(response).to.containSubset({
          content: "testCommand is already enabled.",
        });
      });
    });

    context('when the command is disabled', function () {
      beforeEach(async function () {
        await this.chaos.getService('core', 'CommandService')
          .disableCommand(this.message.guild.id, 'testCommand');
      });

      it('responds that the command now enabled', async function () {
        let response = await this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'enableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).toPromise();

        expect(response).to.containSubset({
          content: "Command `testCommand` has been enabled.",
        });
      });
    });
  });
});
