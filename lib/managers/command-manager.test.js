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
        this.commandOne = { name: "commandOne", run: () => {} };
        this.commandTwo = { name: "commandTwo", run: () => {} };
        this.commandThree = { name: "commandThree", run: () => {} };

        this.commandManager.addCommand('test', this.commandOne);
        this.commandManager.addCommand('test', this.commandTwo);
        this.commandManager.addCommand('test', this.commandThree);
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
      "a object based command": { name: "testCmd" },
      "a class based command": TestCommand,
      "a instance based command": new TestCommand(),
    }).forEach(([commandType, command]) => {
      beforeEach(function () {
        if (command instanceof TestCommand) {
          // manually bind the instance to the chaos bot
          command._chaos = this.chaos;
        }
      });

      context(`when adding ${commandType}`, function () {
        it('makes the command retrievable via #getCommand', function () {
          this.commandManager.addCommand('test', command);
          expect(this.commandManager.getCommand('testCmd').name).to.eq('testCmd');
        });

        context('when a command with the same name has already been added', function () {
          beforeEach(function () {
            this.otherCommand = { name: 'testCmd', run: () => {} };
            this.commandManager.addCommand('test', this.otherCommand);
          });

          it('raises an error', function () {
            expect(() => this.commandManager.addCommand('test', command)).to.throw(
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
        this.command = { name: "commandOne", run: () => {} };
        this.commandManager.addCommand('test', this.command);
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
});
