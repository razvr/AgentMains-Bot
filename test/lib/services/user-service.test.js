const Rx = require('rx');

const UserService = require('../../../lib/core-plugin/services/user-service');
const { UserNotFoundError } = require("../../../lib/errors");

describe('Service: UserService', function () {
  beforeEach(function () {
    this.nix = createNixStub();
    this.nix.discord = Mockery.create('Client');
    this.userService = new UserService(this.nix);
  });

  describe('#findMember', function () {
    const memberId = '000001';
    const memberTag = 'TestUser#0001';

    beforeEach(function () {
      this.guild = Mockery.create('Guild', {
        client: this.nix.discord,
      });
    });

    Object.entries({
      "an user id": memberId,
      "an user mention": `<@${memberId}>`,
      "an alt user mention": `<@!${memberId}>`,
      "an user tag": memberTag,
    }).forEach(([userStringType, userString]) => {
      context(`when the userString is a ${userStringType}`, function () {
        context('when the member does not exist', function () {
          it('throws a UserNotFoundError', function (done) {
            this.userService.findMember(this.guild, userString)
              .catch((error) => {
                expect(error).to.be.an.instanceOf(UserNotFoundError);
                expect(error.message).to.eq(`The user '${userString}' could not be found`);
                return Rx.Observable.empty();
              })
              .subscribe(() => done(new Error('Error was not raised')), (error) => done(error), () => done());
          });
        });

        context('when the member exists in the guild', function () {
          beforeEach(function () {
            this.member = Mockery.create('GuildMember', {
              client: this.nix.discord,
              id: memberId,
              guild: this.guild,
              user: Mockery.create('User', {
                client: this.nix.discord,
                id: memberId,
                tag: memberTag,
              }),
            });
          });

          it('emits the found member', function (done) {
            this.userService.findMember(this.guild, userString)
              .map((member) => expect(member).to.eq(this.member))
              .subscribe(() => done(), (error) => done(error));
          });
        });
      });
    });
  });

  describe('#findUser', function () {
    const userId = '000001';
    const userTag = 'TestUser#0001';

    Object.entries({
      "an user id": userId,
      "an user mention": `<@${userId}>`,
      "an alt user mention": `<@!${userId}>`,
      "an user tag": userTag,
    }).forEach(([userStringType, userString]) => {
      context(`when the userString is a ${userStringType}`, function () {
        context('when the user does not exist', function () {
          it('throws a UserNotFoundError', function (done) {
            this.userService.findUser(userString)
              .catch((error) => {
                expect(error).to.be.an.instanceOf(UserNotFoundError);
                expect(error.message).to.eq(`The user '${userString}' could not be found`);
                return Rx.Observable.empty();
              })
              .subscribe(() => done(new Error('Error was not raised')), (error) => done(error), () => done());
          });
        });

        context('when the user exists', function () {
          beforeEach(function () {
            this.user = Mockery.create('User', {
              client: this.nix.discord,
              id: userId,
              tag: userTag,
            });
          });
          it('emits the found user', function (done) {
            this.userService.findUser(userString)
              .toArray()
              .map(([user]) => expect(user).to.eq(this.user))
              .subscribe(() => done(), (error) => done(error));
          });
        });
      });
    });
  });
});