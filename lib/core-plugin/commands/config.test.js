const ChaosCore = require('../../../index');

const createChaosStub = require('../../test/create-chaos-stub');

describe('Command: !config', function () {
  class ActionOne extends ChaosCore.ConfigAction {
    name = 'action1';
    args = [
      { name: 'arg1', required: true },
      { name: 'arg2' },
    ];
  }

  class ActionTwo extends ChaosCore.ConfigAction {
    name = 'action2';
    args = [
      { name: 'arg1', required: true },
    ];
  }

  class ActionThree extends ChaosCore.ConfigAction {
    name = 'action3';
  }

  beforeEach(async function () {
    this.chaos = createChaosStub();
    this.command = this.chaos.getCommand('config');

    this.message = this.chaos.createMessage({
      content: '!config',
    });

    this.chaos.addPlugin({
      name: "test",
      configActions: [
        ActionOne,
        ActionTwo,
        ActionThree,
      ],
    });

    await this.chaos.listen();

    await this.chaos.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'admin', this.message.author);
    await this.chaos.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'test');
  });

  describe('!config', function () {
    it('replies with the command usage', async function () {
      let responses = await this.chaos.testMessage(this.message);

      expect(responses).to.have.length(1);
      expect(responses[0]).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
        embed: {
          fields: [
            {
              "name": "Usage",
              "value": "!config [--list] <plugin> <action>",
            },
          ],
        },
      });
    });
  });

  describe('!config --list', function () {
    beforeEach(function () {
      this.message.content = '!config --list';
    });

    it('replies with a list of available config actions in all plugins', async function () {
      const coreActions = this.chaos.configManager.actions
        .filter((action) => action.pluginName === "core")
        .map((action) => action.name);

      let responses = await this.chaos.testMessage(this.message);

      expect(responses).to.have.length(1);
      expect(responses[0]).to.containSubset({
        content: "Here's a list of plugins with config actions:",
        embed: {
          fields: [
            { name: "core", value: coreActions.join(', ') },
            { name: "test", value: 'action1, action2, action3' },
          ],
        },
      });
    });
  });

  describe('!config {plugin}', function () {
    beforeEach(function () {
      this.message.content = '!config test';
    });

    it('replies with the command usage', async function () {
      let responses = await this.chaos.testMessage(this.message);

      expect(responses).to.have.length(1);
      expect(responses[0]).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
        embed: {
          fields: [
            { name: "Usage", value: "!config [--list] <plugin> <action>" },
          ],
        },
      });
    });
  });

  describe('!config {plugin} --list', function () {
    beforeEach(function () {
      this.message.content = '!config test --list';
    });

    it('lists config actions in the plugin', async function () {
      let responses = await this.chaos.testMessage(this.message);

      expect(responses).to.have.length(1);
      expect(responses[0]).to.containSubset({
        content: "Here's a list of config actions for test:",
        embed: {
          "fields": [
            {
              name: "action1",
              value:
                "*Usage*:\n" +
                "\t!config test action1 `arg1` `(arg2)`\n" +
                "*Args*:\n" +
                "\t`arg1`\n" +
                "\t`arg2` (optional)",
            },
            {
              name: "action2",
              value:
                "*Usage*:\n" +
                "\t!config test action2 `arg1`\n" +
                "*Args*:\n" +
                "\t`arg1`",
            },
            {
              name: "action3",
              value:
                "*Usage*:\n" +
                "\t!config test action3",
            },
          ],
        },
      });
    });

    it('does not list actions from other plugins', async function () {
      const configActions = Object.values(this.chaos.configManager.actions)
        .filter((action) => action.pluginName !== 'test');

      let responses = await this.chaos.testMessage(this.message);
      expect(responses[0]).not.to.containSubset({
        embed: {
          fields: configActions.map((action) => ({ name: action.name })),
        },
      });
    });

    context('when the plugin does not exist', function () {
      beforeEach(function () {
        this.message.content = '!config foobar --list';
      });

      it('replies with an error message', async function () {
        let responses = await this.chaos.testMessage(this.message);

        expect(responses).to.have.length(1);
        expect(responses[0]).to.containSubset({
          content: 'There is no plugin "foobar".\nYou can use `!config --list` ' +
            'to see a list of all config actions.',
        });
      });
    });
  });

  describe('!config {plugin} {action}', function () {
    beforeEach(function () {
      this.action = this.chaos.getConfigAction('test', 'action1');
      this.message.content = '!config test action1 arg1 arg2';
    });

    it('runs the action', async function () {
      sinon.spy(this.action, 'run');

      let responses = await this.chaos.testMessage(this.message);

      expect(this.action.run).to.have.been.called;
      expect(responses).to.have.length(0);
    });

    context('when the plugin is disabled', function () {
      beforeEach(async function () {
        await this.chaos.getService('core', 'PluginService')
          .disablePlugin(this.message.guild.id, 'test');
      });

      it('gives an error message', async function () {
        sinon.spy(this.action, 'run');

        let responses = await this.chaos.testMessage(this.message);

        expect(this.action.run).not.to.have.been.called;
        expect(responses).to.have.length(1);
        expect(responses[0]).to.containSubset({
          content:
            "The plugin \"test\" is currently disabled.\n" +
            "You can use `!config core enablePlugin test` to enable it.",
        });
      });
    });

    context('when the action does not exist', function () {
      beforeEach(function () {
        this.message.content = '!config test foobar';
      });

      it('replies with an error message', async function () {
        let responses = await this.chaos.testMessage(this.message);

        expect(responses).to.have.length(1);
        expect(responses[0]).to.containSubset({
          content: 'There is no config action "test foobar".\nYou can use ' +
            '`!config test --list` to see a list of all config actions.',
        });
      });
    });

    context('when the user is not an admin', function () {
      beforeEach(async function () {
        await this.chaos.getService('core', 'PermissionsService')
          .removeUser(this.message.guild, 'admin', this.message.author);
      });

      it('does not run the command', async function () {
        sinon.spy(this.command, 'run');

        let responses = await this.chaos.testMessage(this.message);

        expect(this.command.run).not.to.have.been.called;
        expect(responses).to.have.length(0);
      });
    });
  });
});
