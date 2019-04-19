const Rx = require('rx');
const Discord = require('discord.js');

const UserService = require('../../../lib/core-plugin/services/user-service');
const { UserNotFoundError } = require("../../../lib/errors");
const createChaosStub = require('../../create-chaos-stub');
const mocks = require('../../mocks');

describe('Service: UserService', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.userService = new UserService(this.chaos);
  });

  describe('#findMember', function () {
    const memberId = Discord.SnowflakeUtil.generate();
    const memberTag = 'TestUser#0001';

    beforeEach(function () {
      this.guild = new mocks.discord.Guild({
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
            this.user = new mocks.discord.User({
              client: this.chaos.discord,
              data: {
                id: memberId,
                tag: memberTag,
              },
            });

            this.member = new mocks.discord.GuildMember({
              guild: this.guild,
              data: {
                user: this.user,
              },
            });

            this.chaos.discord.users.set(this.user.id, this.user);
            this.guild.members.set(this.member.id, this.member);
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
    const userId = Discord.SnowflakeUtil.generate();
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
              .flatMap(() => Rx.Observable.throw(new Error('Error was not raised')))
              .subscribe(() => {}, done, done);
          });
        });

        context('when the user exists', function () {
          beforeEach(function () {
            this.user = new mocks.discord.User({
              client: this.chaos.discord,
              data: {
                id: userId,
                tag: userTag,
              },
            });
            this.chaos.discord.users.set(this.user.id, this.user);
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