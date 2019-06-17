const { toArray, tap } = require('rxjs/operators');

const CommandManager = require("./command-manager");
const createChaosStub = require('../test/create-chaos-stub');
const { Command } = require("../../index");

describe('CommandManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.commandManager = new CommandManager(this.chaos);
  });

  describe(".chaos", function () {
    it('returns the ChaosCore that the manager was created with', function () {
      expect(this.commandManager.chaos).to.eq(this.chaos);
    });
  });

  describe(".commands", function () {
    context('when no commands have been added', function () {
      it('returns an empty list of commands', function () {
        expect(this.commandManager.commands).to.deep.eq([]);
      });
    });

    context('when commands have been added', function () {
      beforeEach(function () {
        this.commandOne = { pluginName: 'test', name: "commandOne", run: () => {} };
        this.commandTwo = { pluginName: 'test', name: "commandTwo", run: () => {} };
        this.commandThree = { pluginName: 'test', name: "commandThree", run: () => {} };

        this.commandManager.addCommand(this.commandOne);
        this.commandManager.addCommand(this.commandTwo);
        this.commandManager.addCommand(this.commandThree);
      });

      it('returns a list of all added plugins', function () {
        expect(this.commandManager.commands.map((m) => m.name)).to.deep.eq([
          "commandOne",
          "commandTwo",
          "commandThree",
        ]);
      });
    });
  });

  describe("constructor", function () {
    it('initializes the manager with an empty command list', function () {
      expect(this.commandManager.commands).to.deep.eq([]);
    });
  });

  describe("#addCommand", function () {
    class TestCommand extends Command {
      constructor(chaos) {
        super(chaos, {
          name: "testCmd",
          pluginName: 'test',
        });
      }
    }

    Object.entries({
      "a object based command": {
        pluginName: 'test',
        name: "testCmd",
      },
      "a class based command": TestCommand,
    }).forEach(([commandType, command]) => {
      context(`when adding ${commandType}`, function () {
        it('makes the command retrievable via #getCommand', function () {
          this.commandManager.addCommand(command);
          expect(this.commandManager.getCommand('testCmd').name).to.eq('testCmd');
        });

        context('when a command with the same name has already been added', function () {
          beforeEach(function () {
            this.otherCommand = { pluginName: 'test', name: 'testCmd', run: () => {} };
            this.commandManager.addCommand(this.otherCommand);
          });

          it('raises an error', function () {
            expect(() => this.commandManager.addCommand(command)).to.throw(
              Error, "Command 'testCmd' has already been added.",
            );
          });
        });
      });
    });
  });

  describe("#getCommand", function () {
    context('when the command has been added', function () {
      beforeEach(function () {
        this.command = { pluginName: 'test', name: "commandOne", run: () => {} };
        this.commandManager.addCommand(this.command);
      });

      it('returns the plugin', function () {
        expect(this.commandManager.getCommand('commandOne').name).to.eq("commandOne");
      });
    });

    context('when the command has not been added', function () {
      it('raises an error', function () {
        expect(() => this.commandManager.getCommand('commandOne')).to.throw(
          Error, "Command 'commandOne' does not exist",
        );
      });
    });
  });

  describe('event: chaos.listen', function () {
    context('when commands have been added to the manager', function () {
      beforeEach(function () {
        this.commandManager.addCommand({
          pluginName: 'test',
          name: "commandOne",
          onListen: sinon.fake(),
        });

        this.commandManager.addCommand({
          pluginName: 'test',
          name: "commandTwo",
          onListen: sinon.fake(),
        });

        this.commandManager.addCommand({
          pluginName: 'test',
          name: "commandThree",
          onListen: sinon.fake(),
        });
      });

      it('configures all commands', function (done) {
        this.chaos.emit('chaos.listen').pipe(
          toArray(),
          tap(() => {
            [
              this.commandManager.getCommand('commandOne'),
              this.commandManager.getCommand('commandTwo'),
              this.commandManager.getCommand('commandThree'),
            ].forEach((command) => {
              expect(command.onListen).to.have.been.calledOnce;
            });
          }),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
