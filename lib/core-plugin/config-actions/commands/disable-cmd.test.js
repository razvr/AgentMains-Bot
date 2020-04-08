const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.disableCmd', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'disableCmd');
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

  describe('!config core disableCmd', function () {
    it('does not run the action', async function () {
      sinon.spy(this.action, 'run');

      await this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'disableCmd',
        message: this.message,
      }).toPromise();

      expect(this.action.run).not.to.have.been.called;
    });

    it('displays a help message', async function () {
      let response = await this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'disableCmd',
        message: this.message,
      }).toPromise();

      expect(response).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
        embed: {
          title: "disableCmd",
          description: "Explicitly disable a command.",
          fields: [
            {
              name: "Usage",
              value: `!config core disableCmd <command>`,
            },
            {
              name: "Args",
              value: "**command**: The name of the command to disable",
            },
          ],
        },
      });
    });
  });

  describe('!config core disableCmd {command}', function () {
    beforeEach(function () {
      this.chaos.addCommand('test', {
        name: "testCommand",
      });
    });

    context('when the command is enabled', function () {
      it('disables the command', async function () {
        const commandService = this.chaos.getService('core', 'CommandService');
        sinon.spy(commandService, 'disableCommand');

        await this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'disableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).toPromise();

        expect(commandService.disableCommand).to.have.been.calledWith(
          this.message.guild.id, 'testCommand',
        );
      });

      it('responds with a success message', async function () {
        let response = await this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'disableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).toPromise();

        expect(response).to.containSubset({
          content: "Command `testCommand` has been disabled.",
        });
      });
    });

    context('when the command is disabled', function () {
      beforeEach(async function () {
        await this.chaos.getService('core', 'CommandService')
          .disableCommand(this.message.guild.id, 'testCommand');
      });

      it('responds that the command was already disabled', async function () {
        let response = await this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'disableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).toPromise();

        expect(response).to.containSubset({
          content: "testCommand was already disabled.",
        });
      });
    });
  });
});
