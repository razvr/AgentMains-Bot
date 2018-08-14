const MockNixLogger = require("../../support/mock-logger");
const CommandManager = require("../../../lib/managers/command-manager");

describe('CommandManager', function () {
  beforeEach(function () {
    this.services = {
      core: {
        serviceOne: {name: "serviceOne"},
        serviceTwo: {name: "serviceTwo"},
      },
    };

    this.nix = {
      logger: new MockNixLogger(),
      getService: (module, serviceName) => this.services[module][serviceName],
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

    context('when modules have been added', function () {
      beforeEach(function () {
        this.commandOne = {moduleName: 'test', name: "commandOne", run: () => {}};
        this.commandTwo = {moduleName: 'test', name: "commandTwo", run: () => {}};
        this.commandThree = {moduleName: 'test', name: "commandThree", run: () => {}};

        this.commandManager.addCommand(this.commandOne);
        this.commandManager.addCommand(this.commandTwo);
        this.commandManager.addCommand(this.commandThree);
      });

      it('returns a list of all added modules', function () {
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
        this.commandOne = {moduleName: 'test', name: "commandOne", run: () => {}};
        this.commandTwo = {moduleName: 'test', name: "commandTwo", run: () => {}};
        this.commandThree = {moduleName: 'test', name: "commandThree", run: () => {}};

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
      this.command = {moduleName: 'test', name: "commandOne", run: () => {}};
    });

    it('makes the command retrievable via #getCommand', function () {
      this.commandManager.addCommand(this.command);
      expect(this.commandManager.getCommand('commandOne').name).to.eq(this.command.name);
    });

    context('when a command with the same name has already been added', function () {
      beforeEach(function () {
        this.otherCommand = {moduleName: 'test', name: "commandOne", run: () => {}};
        this.commandManager.addCommand(this.otherCommand);
      });

      it('raises an error', function () {
        expect(() => this.commandManager.addCommand(this.command)).to.throw(
          Error, "Command 'commandOne' has already been added."
        );
      });
    });
  });

  describe("#getCommand", function () {
    context('when the command has been added', function () {
      beforeEach(function () {
        this.command = {moduleName: 'test', name: "commandOne", run: () => {}};
        this.commandManager.addCommand(this.command);
      });

      it('returns the module', function () {
        expect(this.commandManager.getCommand('commandOne').name).to.eq("commandOne");
      });
    });

    context('when the command has not been added', function () {
      it('raises an error', function () {
        expect(() => this.commandManager.getCommand('commandOne')).to.throw(
          Error, "Command 'commandOne' does not exist"
        );
      });
    });
  });

  describe("#injectDependencies", function (){
    context('when there are no commands added', function() {
      it('does not add raise an error', function () {
        expect(() => this.commandManager.injectDependencies()).to.not.throw();
      });
    });

    context('when there are commands added', function() {
      beforeEach(function () {
        this.commandOne = {
          moduleName: 'test',
          name: "commandOne",
          run: () => {},
          services: {
            core: [
              "serviceOne",
            ],
          },
        };
        this.commandTwo = {
          moduleName: 'test',
          name: "commandTwo",
          run: () => {},
          services: {
            core: [
              "serviceTwo",
            ],
          },
        };
        this.commandThree = {
          moduleName: 'test',
          name: "commandThree",
          run: () => {},
          services: {
            core: [
              "serviceOne",
              "serviceTwo",
            ],
          },
        };

        this.commandManager.addCommand(this.commandOne);
        this.commandManager.addCommand(this.commandTwo);
        this.commandManager.addCommand(this.commandThree);
      });

      it('injects the requested services', function () {
        this.commandManager.injectDependencies();

        let commandOne = this.commandManager.getCommand("commandOne");
        expect(commandOne.serviceOne).to.eq(this.services.core.serviceOne);
        expect(commandOne.serviceTwo).to.be.undefined;

        let commandTwo = this.commandManager.getCommand("commandTwo");
        expect(commandTwo.serviceOne).to.be.undefined;
        expect(commandTwo.serviceTwo).to.eq(this.services.core.serviceTwo);

        let commandThree = this.commandManager.getCommand("commandThree");
        expect(commandThree.serviceOne).to.eq(this.services.core.serviceOne);
        expect(commandThree.serviceTwo).to.eq(this.services.core.serviceTwo);
      });
    });
  });
});
