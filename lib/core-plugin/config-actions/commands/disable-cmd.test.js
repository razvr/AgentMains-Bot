const { tap, flatMap } = require('rxjs/operators/index');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.disableCmd', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'disableCmd');
    this.message = new MockMessage({});

    this.chaos.addPlugin({
      name: "test",
      configActions: [
        { name: "action1" },
        { name: "action2" },
        { name: "action3" },
      ],
    });

    this.chaos.listen().pipe(
      flatMap(() => this.chaos.getService('core', 'PermissionsService')
        .addUser(this.message.guild, 'admin', this.message.author)),
      flatMap(() => this.chaos.getService('core', 'PluginService')
        .enablePlugin(this.message.guild.id, 'test')),
    ).subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  describe('!config core disableCmd', function () {
    beforeEach(function () {
      this.message.content = '!config core disableCmd';
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
            title: "disableCmd",
            description: "Explicitly disable a command.",
            fields: [
              {
                name: "Usage",
                value: `!config core disableCmd <command>`,
              },
              {
                name: "Inputs",
                value: "**command**: The name of the command to disable",
              },
            ],
          },
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config core disableCmd {command}', function () {
    beforeEach(function () {
      this.chaos.addCommand({
        pluginName: 'test',
        name: "testCommand",
      });

      this.message.content = '!config core disableCmd testCommand';
    });

    context('when the command is enabled', function () {
      it('disables the command', function (done) {
        const commandService = this.chaos.getService('core', 'CommandService');
        sinon.spy(commandService, 'disableCommand');

        this.chaos.testCmdMessage(this.message).pipe(
          tap(() => expect(commandService.disableCommand).to.have.been.calledWith(
            this.message.guild.id, 'testCommand',
          )),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('responds with a success message', function (done) {
        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "testCommand has been disabled",
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

      it('responds that the command was already disabled', function (done) {
        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "testCommand was already disabled.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});