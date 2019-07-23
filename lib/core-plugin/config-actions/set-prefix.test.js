const { zip } = require('rxjs');
const { tap } = require('rxjs/operators');

const createChaosStub = require('../../test/create-chaos-stub');
const { MockMessage } = require("../../test/mocks/discord.mocks");

describe('Config: core.setPrefix', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'setPrefix');
    this.message = new MockMessage();
    this.args = {};
    this.test$ = this.chaos.testConfigAction({
      pluginName: 'core',
      actionName: 'setPrefix',
      message: this.message,
      args: this.args,
    });

    const PermissionsService = this.chaos.getService('core', 'PermissionsService');

    zip(
      PermissionsService.addUser(this.message.guild, 'admin', this.message.author),
    ).subscribe(() => done(), (error) => done(error));
  });

  describe('!config core setPrefix', function () {
    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');

      this.test$.pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.test$.pipe(
        tap((response) => expect(response).to.containSubset({
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
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config core setPrefix prefix', function () {
    beforeEach(function () {
      this.chaos.addCommand('test', {
        name: "testCommand",
      });

      this.args.prefix = "?";
    });

    it('responds with a success message', function (done) {
      this.test$.pipe(
        tap((response) => expect(response).to.containSubset({
          content: "? is now the command prefix.",
        })),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('changes the prefix', function (done) {
      this.test$.pipe(
        tap(() => {
          const commandService = this.chaos.getService('core', 'CommandService');
          expect(commandService.getPrefix(this.message.guild.id)).to.eq('?');
        }),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});