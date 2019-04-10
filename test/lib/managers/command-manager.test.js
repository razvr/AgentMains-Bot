const CommandManager = require("../../../lib/managers/command-manager");

describe('CommandManager', function () {
  beforeEach(function () {
    this.nix = createNixStub();

    this.nix.services = {
      core: {
        serviceOne: {name: "serviceOne"},
        serviceTwo: {name: "serviceTwo"},
      },
    };

    this.commandManager = new CommandManager(this.nix);
  });

  describe(".nix", function () {
    it('returns the nix that the manager was created with', function () {
      expect(this.commandManager.nix).to.eq(this.nix);
    });
  });

  describe(".commands", function () {
    context('when no commands have been added', function () {
      it('returns an empty list of commands', function () {
        expect(this.commandManager.commands).to.deep.eq([]);
      });
    });

    context('when plugins have been added', function () {
      beforeEach(function () {
        this.commandOne = {pluginName: 'test', name: "commandOne", run: () => {}};
        this.commandTwo = {pluginName: 'test', name: "commandTwo", run: () => {}};
        this.commandThree = {pluginName: 'test', name: "commandThree", run: () => {}};

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

  describe("#loadCommands", function () {
    describe('when there are commands listed in the config', function () {
      beforeEach(function () {
        this.commandOne = {pluginName: 'test', name: "commandOne", run: () => {}};
        this.commandTwo = {pluginName: 'test', name: "commandTwo", run: () => {}};
        this.commandThree = {pluginName: 'test', name: "commandThree", run: () => {}};

        this.nix.config = {
          commands: [
            this.commandOne,
            this.commandTwo,
            this.commandThree,
          ],
        };
      });

      it('loads all commands from the nix config', function () {
        this.commandManager.loadCommands();
        expect(this.commandManager.commands.map((c) => c.name)).to.deep.eq([
          "commandOne",
          "commandTwo",
          "commandThree",
        ]);
      });
    });

  });

  describe("#addCommand", function () {
    beforeEach(function () {
      this.command = {pluginName: 'test', name: "commandOne", run: () => {}};
    });

    it('makes the command retrievable via #getCommand', function () {
      this.commandManager.addCommand(this.command);
      expect(this.commandManager.getCommand('commandOne').name).to.eq(this.command.name);
    });

    context('when a command with the same name has already been added', function () {
      beforeEach(function () {
        this.otherCommand = {pluginName: 'test', name: "commandOne", run: () => {}};
        this.commandManager.addCommand(this.otherCommand);
      });

      it('raises an error', function () {
        expect(() => this.commandManager.addCommand(this.command)).to.throw(
          Error, "Command 'commandOne' has already been added.",
        );
      });
    });
  });

  describe("#getCommand", function () {
    context('when the command has been added', function () {
      beforeEach(function () {
        this.command = {pluginName: 'test', name: "commandOne", run: () => {}};
        this.commandManager.addCommand(this.command);
      });

      it('returns the module', function () {
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

  describe('#configureCommands', function () {
    context('when commands have been added to the manager', function () {
      beforeEach(function () {
        this.commandManager.addCommand({
          pluginName: 'test',
          name: "commandOne",
          configureCommand() { this.configured = true; },
          run: () => {},
        });

        this.commandManager.addCommand({
          pluginName: 'test',
          name: "commandTwo",
          configureCommand() { this.configured = true; },
          run: () => {},
        });

        this.commandManager.addCommand({
          pluginName: 'test',
          name: "commandThree",
          configureCommand() { this.configured = true; },
          run: () => {},
        });
      });

      it('configures all commands', function (done) {
        this.commandManager
          .configureCommands()
          .subscribe(
            () => {
              let commands = [
                this.commandManager.getCommand('commandOne'),
                this.commandManager.getCommand('commandTwo'),
                this.commandManager.getCommand('commandThree'),
              ];

              expect(commands.every((command) => command.configured)).to.eq(true);

              done();
            },
            (error) => {
              done(error);
            },
          );
      });
    });
  });
});
