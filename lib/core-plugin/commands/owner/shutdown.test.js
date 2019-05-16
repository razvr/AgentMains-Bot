const { tap } = require('rxjs/operators/index');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Command: !owner:shutdown', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.shutdown = this.chaos.getCommand('owner:shutdown');
    this.message = new MockMessage({});

    this.chaos.listen()
      .subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  describe("!owner:shutdown", function () {
    beforeEach(function () {
      this.message.content = "!owner:shutdown";
    });

    context('when the user is not the bot owner', function () {
      it('does nothing', function (done) {
        sinon.spy(this.shutdown, 'run');
        sinon.spy(this.chaos, 'shutdown');

        this.chaos.testCmdMessage(this.message).pipe(
          tap(() => expect(this.shutdown.run).not.to.have.been.called),
          tap(() => expect(this.chaos.shutdown).not.to.have.been.called),
          tap(({ response }) => expect(response.replies).to.have.length(0)),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the user is the bot owner', function () {
      beforeEach(function () {
        this.message.author.id = this.chaos.owner.id;
      });

      it('stops the bot', function (done) {
        sinon.spy(this.shutdown, 'run');
        sinon.spy(this.chaos, 'shutdown');

        this.chaos.testCmdMessage(this.message).pipe(
          tap(() => expect(this.shutdown.run).to.have.been.called),
          tap(() => expect(this.chaos.shutdown).to.have.been.called),
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            "content": "Ok, shutting down now.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
