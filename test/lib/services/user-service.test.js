const Rx = require('rx');

const UserService = require('../../../lib/core-plugin/services/user-service');
const { UserNotFoundError } = require("../../../lib/errors");
const createChaosStub = require('../../create-chaos-stub');
const mocks = require('../../mocks');

describe('Service: UserService', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.chaos.discord = mocks.discord.build('Client');
    this.userService = new UserService(this.chaos);
  });

  describe('#findMember', function () {
    const memberId = '000001';
    const memberTag = 'TestUser#0001';

    beforeEach(function () {
      this.guild = mocks.discord.build('Guild', {
        client: this.chaos.discord,
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
            this.member = mocks.discord.build('GuildMember', {
              client: this.chaos.discord,
              id: memberId,
              guild: this.guild,
              user: mocks.discord.build('User', {
                client: this.chaos.discord,
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
            this.user = mocks.discord.build('User', {
              client: this.chaos.discord,
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