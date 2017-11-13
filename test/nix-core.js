const expect = require('chai').expect;
const sinon = require('sinon').createSandbox();

const Discord = require('discord.js');

const NixCore = require('./../nix-core');

describe('NixCore', function () {
  let nix;
  let ownerUser;

  beforeEach(function () {
    ownerUser = {
      id: 'ownerUserId',
      username: 'ownerUser',

      send: sinon.stub().resolves(),
    };

    nix = new NixCore({
      ownerUserId: ownerUser.id,
    });
  });

  afterEach(function () {
    nix.shutdown();
    sinon.restore();
  });

  describe('#listen()', function () {
    context('when the login token is not valid', function () {
      let expectedError;

      beforeEach(function () {
        expectedError = new Error("Error from Discord.js");
        sinon.stub(Discord.Client.prototype, 'login').rejects(expectedError);
      });

      it('throws an error', function (done) {
        nix.listen().subscribe(
          () => { done(new Error('next item was passed')); },
          (error) => {
            expect(error).to.not.equal(undefined);
            expect(error.message).to.equal(expectedError.message);
            done();
          }
        );
      });
    });

    context('when the login token is valid', function () {
      beforeEach(function () {
        sinon.stub(Discord.Client.prototype, 'login').resolves();
        sinon.stub(Discord.UserStore.prototype, 'fetch').withArgs(ownerUser.id).resolves(ownerUser);
      });

      it('does not cause an error', function (done) {
        nix.listen().subscribe(
          () => { done(); },
          (error) => { done(new Error('error was passed:', error)); },
        );
      });
    });
  });
});
