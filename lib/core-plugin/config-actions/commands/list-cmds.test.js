const { tap } = require('rxjs/operators');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.listCmds', function () {
  beforeEach(async function () {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'listCmds');
    this.message = new MockMessage();

    this.chaos.addPlugin({
      name: "test",
      commands: [
        { name: "command1" },
        { name: "command2" },
        { name: "command3" },
      ],
    });

    await this.chaos.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'test')
      .toPromise();
  });

  afterEach(async function () {
    if (this.chaos.listening) {
      await this.chaos.shutdown().toPromise();
    }
  });

  describe('!config core listCmds', function () {
    it('runs the action', function (done) {
      sinon.spy(this.action, 'run');

      this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'listCmds',
        message: this.message,
      }).pipe(
        tap(() => expect(this.action.run).to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('lists all available commands', function (done) {
      sinon.spy(this.action, 'run');

      this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'listCmds',
        message: this.message,
      }).pipe(
        tap(() => expect(this.action.run).to.have.been.called),
        tap((response) => expect(response).to.containSubset({
          content: "Here are all my available commands:",
          embed: {
            fields: [
              {
                name: "Enabled Commands:",
                value: [
                  "**== core ==**",
                  "`owner:shutdown`",
                  "- Shutdown",
                  "`owner:listGuilds`",
                  "- list all servers the bot is connected to",
                  "`config`",
                  "- Edit or view settings for this guild",
                  "`help`",
                  "- See all commands that I can do",
                  "**== test ==**",
                  "`command1`",
                  "- null",
                  "`command2`",
                  "- null",
                  "`command3`",
                  "- null",
                ].join("\n"),
              },
            ],
          },
        })),
      ).subscribe(() => done(), (error) => done(error));
    });

    context('when a plugin is disabled', function () {
      beforeEach(async function () {
        await this.chaos.getService('core', 'PluginService')
          .disablePlugin(this.message.guild.id, 'test')
          .toPromise();
      });

      it("lists the commands as disabled", function (done) {
        this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'listCmds',
          message: this.message,
        }).pipe(
          tap((response) => expect(response).to.containSubset({
            content: "Here are all my available commands:",
            embed: {
              fields: [
                {
                  name: "Enabled Commands:",
                  value: [
                    "**== core ==**",
                    "`owner:shutdown`",
                    "- Shutdown",
                    "`owner:listGuilds`",
                    "- list all servers the bot is connected to",
                    "`config`",
                    "- Edit or view settings for this guild",
                    "`help`",
                    "- See all commands that I can do",
                  ].join("\n"),
                },
                {
                  name: "Disabled Commands:",
                  value: [
                    "**== test ==**",
                    "`command1` - plugin 'test' disabled",
                    "- null",
                    "`command2` - plugin 'test' disabled",
                    "- null",
                    "`command3` - plugin 'test' disabled",
                    "- null",
                  ].join("\n"),
                },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when a command is explicitly disabled', function () {
      beforeEach(async function () {
        await this.chaos.getService('core', 'CommandService')
          .disableCommand(this.message.guild.id, 'command2')
          .toPromise();
      });

      it("lists the commands as disabled", function (done) {
        this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'listCmds',
          message: this.message,
        }).pipe(
          tap((response) => expect(response).to.containSubset({
            content: "Here are all my available commands:",
            embed: {
              fields: [
                {
                  name: "Enabled Commands:",
                  value: [
                    "**== core ==**",
                    "`owner:shutdown`",
                    "- Shutdown",
                    "`owner:listGuilds`",
                    "- list all servers the bot is connected to",
                    "`config`",
                    "- Edit or view settings for this guild",
                    "`help`",
                    "- See all commands that I can do",
                    "**== test ==**",
                    "`command1`",
                    "- null",
                    "`command3`",
                    "- null",
                  ].join("\n"),
                },
                {
                  name: "Disabled Commands:",
                  value: [
                    "**== test ==**",
                    "`command2` - explicitly disabled",
                    "- null",
                  ].join("\n"),
                },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
