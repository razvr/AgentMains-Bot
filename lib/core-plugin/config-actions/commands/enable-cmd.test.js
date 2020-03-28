const { tap } = require('rxjs/operators');

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
    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');

      this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'enableCmd',
        message: this.message,
      }).pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'enableCmd',
        message: this.message,
      }).pipe(
        tap((response) => expect(response).to.containSubset({
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
        })),
      ).subscribe(() => done(), (error) => done(error));
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
      it('responds that the command was already enabled', function (done) {
        this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'enableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).pipe(
          tap((response) => expect(response).to.containSubset({
            content: "testCommand is already enabled.",
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

      it('responds that the command now enabled', function (done) {
        this.chaos.testConfigAction({
          pluginName: 'core',
          actionName: 'enableCmd',
          message: this.message,
          args: { command: "testCommand" },
        }).pipe(
          tap((response) => expect(response).to.containSubset({
            content: "Command `testCommand` has been enabled.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
