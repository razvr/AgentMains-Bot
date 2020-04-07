const { tap } = require('rxjs/operators');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Command: !owner:shutdown', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.command = this.chaos.getCommand('owner:shutdown');
    this.message = new MockMessage();

    this.chaos.listen().subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  describe("!owner:shutdown", function () {
    context('when the user is not the bot owner', function () {
      it('does nothing', async function () {
        sinon.spy(this.command, 'run');
        sinon.spy(this.chaos, 'shutdown');

        let response = await this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'owner:shutdown',
          message: this.message,
        }).toPromise();

        expect(this.command.run).not.to.have.been.called;
        expect(this.chaos.shutdown).not.to.have.been.called;
        expect(response.replies).to.have.length(0);
      });
    });

    context('when the user is the bot owner', function () {
      beforeEach(function () {
        this.message.author.id = this.chaos.owner.id;
      });

      it('stops the bot', function (done) {
        sinon.spy(this.command, 'run');
        sinon.spy(this.chaos, 'shutdown');

        this.chaos.testCommand({
          pluginName: 'core',
          commandName: 'owner:shutdown',
          message: this.message,
        }).pipe(
          tap((response) => expect(response).to.containSubset({
            "content": "Ok, shutting down now.",
          })),
          tap(() => expect(this.command.run).to.have.been.called),
          tap(() => expect(this.chaos.shutdown).to.have.been.called),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
