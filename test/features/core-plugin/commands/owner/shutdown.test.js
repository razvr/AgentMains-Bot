const { SnowflakeUtil } = require('discord.js');
const { tap } = require('rxjs/operators');

const createChaosStub = require('../../../../create-chaos-stub');

describe('Command: !owner:shutdown', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.shutdown = this.chaos.getCommand('owner:shutdown');

    this.guild = {
      id: SnowflakeUtil.generate(),
      name: "test-guild 1",
    };

    this.channel = {
      id: SnowflakeUtil.generate(),
      type: 'text',
      name: "test-channel 1",

      guild: this.guild,

      send: sinon.fake.resolves('Message'),
      permissionsFor: () => ({
        has: () => true,
      }),
    };

    this.user = {
      id: SnowflakeUtil.generate(),
      tag: 'testUser#0001',
    };

    this.message = {
      id: SnowflakeUtil.generate(),
      content: '!owner:shutdown',

      author: this.user,
      channel: this.channel,
      guild: this.guild,
    };

    this.chaos.listen().subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  context('when the user is not the bot owner', function () {
    it('does nothing', function (done) {
      sinon.spy(this.shutdown, 'run');
      sinon.spy(this.chaos, 'shutdown');

      this.chaos.testCmdMessage(this.message).pipe(
        tap(() => expect(this.shutdown.run).not.to.have.been.called),
        tap(() => expect(this.chaos.shutdown).not.to.have.been.called),
        tap(({response}) => expect(response.replies).to.have.length(0)),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the user is the bot owner', function () {
    beforeEach(function () {
      this.user.id = this.chaos.owner.id;
    });

    it('stops the bot', function (done) {
      sinon.spy(this.shutdown, 'run');
      sinon.spy(this.chaos, 'shutdown');

      this.chaos.testCmdMessage(this.message).pipe(
        tap(() => expect(this.shutdown.run).to.have.been.called),
        tap(() => expect(this.chaos.shutdown).to.have.been.called),
        tap(({response}) => expect(response.replies).to.have.length(1)),
        tap(({response}) => expect(response.replies[0]).to.containSubset({
          "content": "Ok, shutting down now.",
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});