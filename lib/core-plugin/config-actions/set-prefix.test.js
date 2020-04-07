const createChaosStub = require('../../test/create-chaos-stub');
const { MockMessage } = require("../../test/mocks/discord.mocks");

describe('Config: core.setPrefix', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'setPrefix');
    this.message = new MockMessage();
    this.args = {};

    this.runTest = () => {
      return this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'setPrefix',
        message: this.message,
        args: this.args,
      }).toPromise();
    };
  });

  describe('!config core setPrefix', function () {
    it('does not run the action', async function () {
      sinon.spy(this.action, 'run');
      await this.runTest();
      expect(this.action.run).not.to.have.been.called;
    });

    it('displays a help message', async function () {
      let response = await this.runTest();

      expect(response).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
        embed: {
          title: "setPrefix",
          description: "Change the prefix for this server.",
          fields: [
            {
              name: "Usage",
              value: `!config core setPrefix <prefix>`,
            },
            {
              name: "Args",
              value: "**prefix**: The new prefix to use for commands.",
            },
          ],
        },
      });
    });
  });

  describe('!config core setPrefix prefix', function () {
    beforeEach(function () {
      this.chaos.addCommand('test', {
        name: "testCommand",
      });

      this.args.prefix = "?";
    });

    it('responds with a success message', async function () {
      let response = await this.runTest();
      expect(response).to.containSubset({
        content: "? is now the command prefix.",
      });
    });

    it('changes the prefix', async function () {
      await this.runTest();
      const commandService = this.chaos.getService('core', 'CommandService');
      expect(commandService.getPrefix(this.message.guild.id)).to.eq('?');
    });
  });
});
