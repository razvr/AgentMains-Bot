const { tap, flatMap } = require('rxjs/operators/index');

const createChaosStub = require('../../test/create-chaos-stub');
const { MockMessage } = require("../../test/mocks/discord.mocks");

describe('Command: !help', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.command = this.chaos.getCommand('help');
    this.message = new MockMessage();

    this.chaos.addPlugin({
      name: "test",
      commands: [
        { name: "command1", description: "Test command 1", run: () => {} },
        { name: "command2", description: "Test command 2", run: () => {} },
        { name: "command3", description: "Test command 3", run: () => {} },
      ],
    });

    this.chaos.listen().pipe(
      flatMap(() => this.chaos.getService('core', 'PluginService')
        .enablePlugin(this.message.guild.id, 'test'),
      ),
    ).subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown()
        .subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  describe('!help', function () {
    beforeEach(function () {
      this.message.content = '!help';
    });

    it('shows commands that the user can run', function (done) {
      this.chaos.testCommand({
        pluginName: 'core',
        commandName: 'help',
        message: this.message,
      }).pipe(
        tap((response) => expect(response.replies).to.have.length(1)),
        tap((response) => expect(response.replies[0]).to.containSubset({
          content:
            "Here's everything that I can do for you.\n" +
            "If you want more help on a specific command, " +
            "add '--help' to the command",
          embed: {
            fields: [
              {
                name: "core",
                value:
                  "*!help*\n" +
                  "See all commands that I can do",
              },
              {
                name: "test",
                value:
                  "*!command1*\n" +
                  "Test command 1\n" +
                  "*!command2*\n" +
                  "Test command 2\n" +
                  "*!command3*\n" +
                  "Test command 3",
              },
            ],
          },
        })),
      ).subscribe(() => done(), (error) => done(error));
    });

    context('when plugins are disabled', function () {
      beforeEach(function (done) {
        this.chaos.getService('core', 'PluginService')
          .disablePlugin(this.message.guild.id, 'test')
          .subscribe(() => done(), (error) => done(error));
      });

      it('hides commands from plugins that are disabled', function (done) {
        this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'help',
          message: this.message,
        }).pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies[0]).not.to.containSubset({
            embed: {
              fields: [{ name: "test" }],
            },
          })),
          tap((response) => expect(response.replies[0]).to.containSubset({
            embed: {
              fields: [
                {
                  name: "core",
                  value:
                    "*!help*\n" +
                    "See all commands that I can do",
                },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when commands are explicitly disabled', function () {
      beforeEach(function (done) {
        this.chaos.getService('core', 'CommandService')
          .disableCommand(this.message.guild.id, 'command2')
          .subscribe(() => done(), (error) => done(error));
      });

      it('hides commands that are disabled', function (done) {
        this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'help',
          message: this.message,
        }).pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
            embed: {
              fields: [
                {
                  name: "core",
                  value:
                    "*!help*\n" +
                    "See all commands that I can do",
                },
                {
                  name: "test",
                  value:
                    "*!command1*\n" +
                    "Test command 1\n" +
                    "*!command3*\n" +
                    "Test command 3",
                },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the user has permission to run a command', function () {
      beforeEach(function (done) {
        this.chaos.addCommand('test', {
          name: "adminCommand1",
          description: "Test admin command 3",
          permissions: ["admin"],
          run: () => {},
        });

        this.chaos.getService('core', 'PermissionsService')
          .addUser(this.message.guild, 'admin', this.message.author)
          .subscribe(() => done(), (error) => done(error));
      });

      it('lists commands that the user can run', function (done) {
        this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'help',
          message: this.message,
        }).pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
            embed: {
              fields: [
                {
                  name: "core",
                  value:
                    "*!config*\n" +
                    "Edit or view settings for this guild\n" +
                    "*!help*\n" +
                    "See all commands that I can do",
                },
                {
                  name: "test",
                  value:
                    "*!adminCommand1*\n" +
                    "Test admin command 3\n" +
                    "*!command1*\n" +
                    "Test command 1\n" +
                    "*!command2*\n" +
                    "Test command 2\n" +
                    "*!command3*\n" +
                    "Test command 3",
                },
              ],
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
