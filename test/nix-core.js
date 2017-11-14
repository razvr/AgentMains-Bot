const chai = require("chai");
const sinonChai = require("sinon-chai");
const Discord = require('discord.js');
const sinon = require('sinon').createSandbox();

const NixCore = require('./../nix-core');

const expect = chai.expect;
chai.use(sinonChai);

describe('NixCore', function () {
  let nix;
  let ownerUser;

  beforeEach(function () {
    ownerUser = {
      id: 'ownerUserId',
      username: 'ownerUser',

      send: sinon.stub().callsFake((msg) => console.log("Sending message:", msg)),
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
        sinon.stub(nix.discord, 'login').rejects(expectedError);
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
        sinon.stub(nix.discord, 'login').resolves();
        sinon.stub(nix.discord.users, 'fetch').withArgs(ownerUser.id).resolves(ownerUser);
      });

      it('does not cause an error', function (done) {
        nix.listen().subscribe(
          () => { done(); },
          (error) => { done(new Error('error was passed:', error)); }
        );
      });
    });
  });

  describe('received events', function () {
    beforeEach(function () {
      sinon.stub(Discord.Client.prototype, 'login').resolves();
      sinon.stub(Discord.UserStore.prototype, 'fetch').withArgs(ownerUser.id).resolves(ownerUser);
    });

    context('when nix core receives message', function () {
      let message;

      beforeEach(function () {
        message = {content: 'message'};
      });

      it('checks if the message is a command', function (done) {
        let msgIsCommand = sinon.spy(nix.commandManager, 'msgIsCommand');

        nix.listen().subscribe(
          () => {
            nix.streams.message$.subscribe(
              () => {
                expect(msgIsCommand).to.have.been.calledWith(message);
                done();
              },
              (err) => done(err)
            );

            nix.discord.emit('message', message);
          },
          (err) => done(err)
        );
      });

      context('when the message contains a command', function () {
        let msgIsCommand;
        let runCommandForMsg;

        beforeEach(function () {
          msgIsCommand = sinon.stub(nix.commandManager, 'msgIsCommand').returns(true);
          runCommandForMsg = sinon.stub(nix.commandManager, 'runCommandForMsg').resolves();
        });

        it('runs the requested command', function (done) {
          nix.listen().subscribe(
            () => {
              nix.streams.message$.subscribe(
                () => {
                  expect(msgIsCommand).to.have.been.calledWith(message);
                  expect(runCommandForMsg).to.have.been.calledWith(message);
                  done();
                },
                (err) => done(err)
              );

              nix.discord.emit('message', message);
            },
            (err) => done(err)
          );
        });
      });

      context('when the message does not contain a command', function () {
        let msgIsCommand;
        let runCommandForMsg;

        beforeEach(function () {
          msgIsCommand = sinon.stub(nix.commandManager, 'msgIsCommand').returns(false);
          runCommandForMsg = sinon.stub(nix.commandManager, 'runCommandForMsg').resolves();
        });

        it('runs the requested command', function (done) {
          nix.listen().subscribe(
            () => {
              nix.streams.message$.subscribe(
                () => {
                  expect(msgIsCommand).to.have.been.calledWith(message);
                  expect(runCommandForMsg).not.to.have.been.calledWith(message);
                  done();
                },
                (err) => done(err)
              );

              nix.discord.emit('message', message);
            },
            (err) => done(err)
          );
        });
      });
    });
  });
});
