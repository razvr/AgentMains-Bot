const Discord = require('discord.js');

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
    const memberDiscriminator = '0001';
    const memberTag = memberUsername + '#' + memberDiscriminator;
    const memberNickname = 'TestNickname';

    beforeEach(function () {
      this.guild = new MockGuild(this.chaos.discord);
    });

    context('when the member does not exist', function () {
      it('throws a UserNotFoundError', async function () {
        try {
          await this.userService.findMember(this.guild, "nullUser");
        } catch (error) {
          expect(error).to.be.an.instanceOf(UserNotFoundError);
          expect(error.message).to.eq(`The user 'nullUser' could not be found`);
          return;
        }

        throw new Error('Error was not raised');
      });
    });

    context('when the member exists in the guild', function () {
      beforeEach(function () {
        this.user = new MockUser(this.chaos.discord, {
          id: memberId,
          username: memberUsername,
          discriminator: memberDiscriminator,
        });

        this.member = new MockGuildMember(this.chaos.discord, {
          nick: memberNickname,
          user: this.user,
        }, this.guild);

        this.chaos.discord.users.cache.set(this.user.id, this.user);
        this.guild.members.cache.set(this.member.id, this.member);
      });

      Object.entries({
        "an user's id": memberId,
        "an user mention": `<@${memberId}>`,
        "an alt user mention": `<@!${memberId}>`,
        "an user's tag": memberTag,
      }).forEach(([userStringType, userString]) => {
        context(`when the userString is ${userStringType}`, function () {
          it('emits the found member', async function () {
            let member = await this.userService.findMember(this.guild, userString);
            expect(member).to.eq(this.member);
          });
        });
      });

      context("when the userString is an user's username", function () {
        it('emits the found member', async function () {
          let member = await this.userService.findMember(this.guild, memberUsername);
          expect(member).to.eq(this.member);
        });

        context('when multiple users have the same username', function () {
          beforeEach(function () {
            this.user = new MockUser(this.chaos.discord, {
              username: memberUsername,
              discriminator: '0002',
            });

            this.member = new MockGuildMember(this.chaos.discord, {
              user: this.user,
            }, this.guild);

            this.chaos.discord.users.cache.set(this.user.id, this.user);
            this.guild.members.cache.set(this.member.id, this.member);
          });

          it('emits an error', async function () {
            try {
              await this.userService.findMember(this.guild, memberUsername);
            } catch (error) {
              expect(error).to.be.an.instanceOf(AmbiguousUserError);
              expect(error.message).to.include("'TestUser' matched to multiple users.");
              return;
            }

            throw new Error('Error was not raised');
          });
        });
      });

      context(`when the userString is an user's nickname`, function () {
        it('emits the found member', async function () {
          let member = await this.userService.findMember(this.guild, memberNickname);
          expect(member).to.eq(this.member);
        });

        context('when multiple users have the same nickname', function () {
          beforeEach(function () {
            this.user = new MockUser(this.chaos.discord, {
              username: "otherUser",
              discriminator: '0001',
            });

            this.member = new MockGuildMember(this.chaos.discord, {
              nick: memberNickname,
              user: this.user,
            }, this.guild);

            this.chaos.discord.users.cache.set(this.user.id, this.user);
            this.guild.members.cache.set(this.member.id, this.member);
          });

          it('emits an error', async function () {
            try {
              await this.userService.findMember(this.guild, memberNickname);
            } catch (error) {
              expect(error).to.be.an.instanceOf(AmbiguousUserError);
              expect(error.message).to.include("'TestNickname' matched to multiple users.");
              return;
            }

            throw new Error('Error was not raised');
          });
        });
      });
    });
  });

  describe('#findUser', function () {
    const userId = Discord.SnowflakeUtil.generate();
    const userUsername = 'TestUser';
    const userDiscriminator = '0001';
    const userTag = userUsername + '#' + userDiscriminator;

    Object.entries({
      "an user id": userId,
      "an user mention": `<@${userId}>`,
      "an alt user mention": `<@!${userId}>`,
      "an user tag": userTag,
    }).forEach(([userStringType, userString]) => {
      context(`when the userString is a ${userStringType}`, function () {
        context('when the user does not exist', function () {
          beforeEach(function () {
            sinon.stub(this.chaos.discord.users, 'fetch').rejects(new Discord.DiscordAPIError(
              '/test',
              ['Unknown User'],
              'GET',
              404,
            ));
          });

          it('throws a UserNotFoundError', async function () {
            try {
              await this.userService.findUser(userString);
            } catch (error) {
              expect(error).to.be.an.instanceOf(UserNotFoundError);
              expect(error.message).to.eq(`The user '${userString}' could not be found`);
              return;
            }

            throw new Error('Error was not raised');
          });
        });

        context('when the user exists', function () {
          beforeEach(function () {
            this.user = new MockUser(this.chaos.discord, {
              id: userId,
              username: userUsername,
              discriminator: userDiscriminator,
            });
          });

          it('emits the found user', async function () {
            let user = await this.userService.findUser(userString);
            expect(user).to.eq(this.user);
          });
        });
      });
    });
  });
});
