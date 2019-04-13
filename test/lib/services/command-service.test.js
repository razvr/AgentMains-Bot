const Command = require('../../../lib/models/command');
const CommandContext = require('../../../lib/models/command-context');
const CommandService = require('../../../lib/core-plugin/services/command-service');
const createChaosStub = require('../../create-chaos-stub');
const mocks = require('../../mocks');

describe('CommandService', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.commandService = new CommandService(this.chaos);
  });

  describe('#filterCanRunCommand', function () {
    beforeEach(function () {
      this.message = mocks.discord.build("Message");

      this.command = new Command(this.chaos, {
        name: "testCommand",
        pluginName: "testPlugin",
        run: () => {},
      });
      this.context = new CommandContext(this.chaos, this.message, this.command, {}, {});
    });

    context('when the bot can not send a message to the channel', function() {
      it('emits no elements', function (done) {
        this.commandService.filterCanRunCommand(this.context)
          .toArray()
          .map((emitted) => expect(emitted.length).to.eq(0))
          .subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
