const expect = require('chai').expect;
const sinon = require('sinon');
const Discord = require('discord.js');

const NixCore = require('./../nix-core');

describe('NixCore', function () {
  let nix;

  before(function () {
    nix = new NixCore({});
  });

  describe('#listen()', function () {
    context('when the login token is not valid', function () {
      let expectedError;

      before(function () {
        expectedError = new Error("Error from Discord.js");

        Discord.Client.prototype.login =
          sinon.stub().callsFake(() => new Promise((resolve, reject) => reject(expectedError)));
      });

      it('throws an error', function (done) {
        nix.listen().subscribe(
          () => {
            done(new Error('next item was passed'));
          },
          (error) => {
            expect(error).to.not.equal(undefined);
            expect(error.message).to.equal(expectedError.message);
            done();
          }
        );
      });
    });
  });
});
