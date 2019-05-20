const { EMPTY } = require('rxjs/index');
const { catchError, tap, toArray } = require('rxjs/operators/index');
const Discord = require('discord.js');
const { SnowflakeUtil } = require('discord.js');

const UserService = require('./user-service');
const { UserNotFoundError } = require("../../errors");
const createChaosStub = require('../../test/create-chaos-stub');
const { AmbiguousUserError } = require("../../errors");
const { MockGuildMember } = require("../../test/mocks/discord.mocks");
const { MockUser } = require("../../test/mocks/discord.mocks");
const { MockGuild } = require("../../test/mocks/discord.mocks");

describe('Service: UserService', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.userService = new UserService(this.chaos);
  });

  describe('#findMember', function () {
    const memberId = Discord.SnowflakeUtil.generate();
    const memberUsername = 'TestUser';
    const memberTag = memberUsername + '#0001';
    const memberNickname = 'TestNickname';

    beforeEach(function () {
      this.guild = new MockGuild({
        client: this.chaos.discord,
      });
    });

    context('when the member does not exist', function () {
      it('throws a UserNotFoundError', function (done) {
        this.userService.findMember(this.guild, "nullUser").pipe(
          catchError((error) => {
            expect(error).to.be.an.instanceOf(UserNotFoundError);
            expect(error.message).to.eq(`The user 'nullUser' could not be found`);
            return EMPTY;
          }),
        ).subscribe(() => done(new Error('Error was not raised')), (error) => done(error), () => done());
      });
    });

    context('when the member exists in the guild', function () {
      beforeEach(function () {
        this.user = new MockUser({
          client: this.chaos.discord,
          data: {
            id: memberId,
            tag: memberTag,
          },
        });

        this.member = new MockGuildMember({
          guild: this.guild,
          data: {
            nick: memberNickname,
            user: this.user,
          },
        });

        this.chaos.discord.users.set(this.user.id, this.user);
        this.guild.members.set(this.member.id, this.member);
      });

      Object.entries({
        "an user's id": memberId,
        "an user mention": `<@${memberId}>`,
        "an alt user mention": `<@!${memberId}>`,
        "an user's tag": memberTag,
      }).forEach(([userStringType, userString]) => {
        context(`when the userString is ${userStringType}`, function () {
          it('emits the found member', function (done) {
            this.userService.findMember(this.guild, userString).pipe(
              tap((member) => expect(member).to.eq(this.member)),
            ).subscribe(() => done(), (error) => done(error));
          });
        });
      });

      context("when the userString is an user's username", function () {
        it('emits the found member', function (done) {
          this.userService.findMember(this.guild, memberUsername).pipe(
            tap((member) => expect(member).to.eq(this.member)),
          ).subscribe(() => done(), (error) => done(error));
        });

        context('when multiple users have the same username', function () {
          beforeEach(function () {
            this.user = new MockUser({
              client: this.chaos.discord,
              data: {
                id: SnowflakeUtil.generate(),
                tag: memberUsername + "#0002",
              },
            });

            this.member = new MockGuildMember({
              guild: this.guild,
              data: {
                user: this.user,
              },
            });

            this.chaos.discord.users.set(this.user.id, this.user);
            this.guild.members.set(this.member.id, this.member);
          });

          it('emits an error', function (done) {
            this.userService.findMember(this.guild, memberUsername).pipe(
              catchError((error) => {
                expect(error).to.be.an.instanceOf(AmbiguousUserError);
                expect(error.message).to.include("'TestUser' matched to multiple users.");
                return EMPTY;
              }),
            ).subscribe(() => done(new Error('Error was not raised')), (error) => done(error), () => done());
          });
        });
      });

      context(`when the userString is an user's nickname`, function () {
        it('emits the found member', function (done) {
          this.userService.findMember(this.guild, memberNickname).pipe(
            tap((member) => expect(member).to.eq(this.member)),
          ).subscribe(() => done(), (error) => done(error));
        });

        context('when multiple users have the same nickname', function () {
          beforeEach(function () {
            this.user = new MockUser({
              client: this.chaos.discord,
              data: {
                id: SnowflakeUtil.generate(),
                tag: "otherUser#0001",
              },
            });

            this.member = new MockGuildMember({
              guild: this.guild,
              data: {
                nick: memberNickname,
                user: this.user,
              },
            });

            this.chaos.discord.users.set(this.user.id, this.user);
            this.guild.members.set(this.member.id, this.member);
          });

          it('emits an error', function (done) {
            this.userService.findMember(this.guild, memberNickname).pipe(
              catchError((error) => {
                expect(error).to.be.an.instanceOf(AmbiguousUserError);
                expect(error.message).to.include("'TestNickname' matched to multiple users.");
                return EMPTY;
              }),
            ).subscribe(() => done(new Error('Error was not raised')), (error) => done(error), () => done());
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
            this.userService.findUser(userString).pipe(
              toArray(),
              catchError((error) => {
                expect(error).to.be.an.instanceOf(UserNotFoundError);
                expect(error.message).to.eq(`The user '${userString}' could not be found`);
                return EMPTY;
              }),
            ).subscribe(() => done(new Error('Error was not raised')), done, done);
          });
        });

        context('when the user exists', function () {
          beforeEach(function () {
            this.user = new MockUser({
              client: this.chaos.discord,
              data: {
                id: userId,
                tag: userTag,
              },
            });
            this.chaos.discord.users.set(this.user.id, this.user);
          });

          it('emits the found user', function (done) {
            this.userService.findUser(userString).pipe(
              tap((user) => expect(user).to.eq(this.user)),
            ).subscribe(() => done(), (error) => done(error));
          });
        });
      });
    });
  });
});