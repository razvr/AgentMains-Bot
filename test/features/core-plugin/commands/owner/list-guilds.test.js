const { tap } = require('rxjs/operators');

const createChaosStub = require('../../../../create-chaos-stub');
const { MockMessage } = require("../../../../mocks/discord.mocks");

describe('Command: !owner:listGuilds', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.command = this.chaos.getCommand('owner:listGuilds');
    this.message = new MockMessage({});

    [
      { name: "guild1", id: "guildId-00001" },
      { name: "guild2", id: "guildId-00002" },
      { name: "guild3", id: "guildId-00003" },
    ].forEach((guild) => {
      this.chaos.discord.guilds.set(guild.id, guild);
    });

    this.chaos.listen().subscribe(() => done(), (error) => done(error));
  });

  describe("!owner:listGuilds", function () {
    beforeEach(function () {
      this.message.content = "!owner:listGuilds";
    });

    context('when the user is not the bot owner', function () {
      it('does nothing', function (done) {
        sinon.spy(this.command, 'run');

        this.chaos.testCmdMessage(this.message).pipe(
          tap(() => expect(this.command.run).not.to.have.been.called),
          tap(({ response }) => expect(response.replies).to.have.length(0)),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the user is the bot owner', function () {
      beforeEach(function () {
        this.message.author.id = this.chaos.owner.id;
      });

      it('replies with a list of all guilds', function (done) {
        sinon.spy(this.command, 'run');

        this.chaos.testCmdMessage(this.message).pipe(
          tap(() => expect(this.command.run).to.have.been.called),
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content:
              "I'm in the following guilds:\n" +
              "- guild1 (guildId-00001)\n" +
              "- guild2 (guildId-00002)\n" +
              "- guild3 (guildId-00003)",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});