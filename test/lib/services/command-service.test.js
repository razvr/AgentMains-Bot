const Discord = require('discord.js');
const { toArray, map } = require('rxjs/operators');

const Command = require('../../../lib/models/command');
const CommandContext = require('../../../lib/models/command-context');
const CommandService = require('../../../lib/core-plugin/services/command-service');
const createChaosStub = require('../../create-chaos-stub');
const { MockMessage } = require("../../mocks/discord.mocks");

describe('CommandService', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.commandService = new CommandService(this.chaos);
    this.chaos.discord.login().then(() => done());
  });

  describe('#filterCanRunCommand', function () {
    beforeEach(function () {
      this.message = new MockMessage({
        client: this.chaos.discord,
      });

      this.command = new Command(this.chaos, {
        name: "testCommand",
        pluginName: "testPlugin",
      });
      this.context = new CommandContext(this.message, this.command, {}, {});
    });

    context('when the bot can not send a message to the channel', function () {
      beforeEach(function () {
        this.channel = this.message.channel;
        this.channel.permissionsFor = (memberOrRole) => {
          if (memberOrRole.id === this.chaos.discord.user.id) {
            return new Discord.Permissions([]);
          } else {
            return null;
          }
        };
      });

      it('emits no elements', function (done) {
        this.commandService.filterCanRunCommand(this.context).pipe(
          toArray(),
          map((emitted) => expect(emitted.length).to.eq(0)),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
