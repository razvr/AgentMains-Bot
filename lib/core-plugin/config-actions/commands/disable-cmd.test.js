const { zip } = require('rxjs');
const { tap } = require('rxjs/operators');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.disableCmd', function () {
  beforeEach(function (done) {
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

    const PermissionsService = this.chaos.getService('core', 'PermissionsService');
    const PluginService = this.chaos.getService('core', 'PluginService');

    zip(
      PermissionsService.addUser(this.message.guild, 'admin', this.message.author),
      PluginService.enablePlugin(this.message.guild.id, 'test'),
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
    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');

      this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'disableCmd',
        message: this.message,
      }).pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'disableCmd',
        message: this.message,
      }).pipe(
        tap((response) => expect(response).to.containSubset({
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
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config core disableCmd {command}', function () {
    beforeEach(function () {
      this.chaos.addCommand('test', {
        name: "testCommand",
      });
    });

    context('when the command is enabled', function () {
      it('disables the command', function (done) {
        const commandService = this.chaos.getService('core', 'CommandService');
        sinon.spy(commandService, 'disableCommand');

        this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'disableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).pipe(
          tap(() => expect(commandService.disableCommand).to.have.been.calledWith(
            this.message.guild.id, 'testCommand',
          )),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('responds with a success message', function (done) {
        this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'disableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).pipe(
          tap((response) => expect(response).to.containSubset({
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
        this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'disableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).pipe(
          tap((response) => expect(response).to.containSubset({
            content: "testCommand was already disabled.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});