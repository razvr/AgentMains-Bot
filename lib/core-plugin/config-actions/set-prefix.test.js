const { of } = require('rxjs');
const { tap, flatMap } = require('rxjs/operators');

const createChaosStub = require('../../test/create-chaos-stub');
const { MockMessage } = require("../../test/mocks/discord.mocks");

describe('Config: core.setPrefix', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'setPrefix');
    this.message = new MockMessage({});

    this.chaos.listen().pipe(
      flatMap(() => this.chaos.getService('core', 'PermissionsService')
        .addUser(this.message.guild, 'admin', this.message.author)),
    ).subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  describe('!config core setPrefix', function () {
    beforeEach(function () {
      this.message.content = '!config core setPrefix';
    });

    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');
      this.chaos.testCmdMessage(this.message).pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.chaos.testCmdMessage(this.message).pipe(
        tap(({ response }) => expect(response.replies).to.have.length(1)),
        tap(({ response }) => expect(response.replies[0]).to.containSubset({
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
                name: "Inputs",
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

      this.message.content = '!config core setPrefix ?';
    });

    it('responds with a success message', function (done) {
      this.chaos.testCmdMessage(this.message).pipe(
        tap(({ response }) => expect(response.replies).to.have.length(1)),
        tap(({ response }) => expect(response.replies[0]).to.containSubset({
          content: "? is now the command prefix.",
        })),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('changes the prefix', function (done) {
      const plugin = {
        name: 'test',
        commands: [{ name: "test", run: sinon.fake() }],
      };

      this.chaos.addPlugin(plugin);
      const testCommand = this.chaos.getCommand('test', 'test');

      const newPrefixMsg = new MockMessage({
        channel: this.message.channel,
        data: {
          content: '?test',
        },
        client: this.chaos.discord,
      });

      of('').pipe(
        flatMap(() => this.chaos.getService('core', 'PluginService')
          .enablePlugin(this.message.guild.id, 'test')),
        flatMap(() => this.chaos.testCmdMessage(this.message)),
        tap(({ response }) => expect(response.replies).to.have.length(1)),
        flatMap(() => this.chaos.testCmdMessage(newPrefixMsg)),
        tap(() => expect(testCommand.run).to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});