const { zip } = require('rxjs');
const { tap } = require('rxjs/operators');
const { SnowflakeUtil } = require('discord.js');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.grantUser', function () {
  const userId = SnowflakeUtil.generate();

  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'grantUser');
    this.message = new MockMessage();
    this.args = {};
    this.test$ = this.chaos.testConfigAction({
      pluginName: 'core',
      actionName: 'grantUser',
      message: this.message,
      args: this.args,
    });

    this.chaos.addPlugin({
      name: "test",
      permissions: ['testLevel'],
    });

    this.member = {
      id: userId,
      displayName: 'testNickname',
      nickname: 'testNickname',
      user: {
        id: userId,
        username: "testUser",
        tag: "testUser#0001",
      },
    };
    this.message.guild.members.set(this.member.id, this.member);

    const PermissionsService = this.chaos.getService('core', 'PermissionsService');
    const PluginService = this.chaos.getService('core', 'PluginService');

    zip(
      PermissionsService.addUser(this.message.guild, 'admin', this.message.author),
      PluginService.enablePlugin(this.message.guild.id, 'test'),
    ).subscribe(() => done(), (error) => done(error));
  });

  describe('!config core grantUser', function () {
    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');

      this.test$.pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.test$.pipe(
        tap((response) => expect(response).to.containSubset({
          content: "I'm sorry, but I'm missing some information for that command:",
          embed: {
            title: "grantUser",
            description: "Add a user to a permission level.",
            fields: [
              {
                name: "Usage",
                value: '!config core grantUser <user> <level>',
              },
              {
                name: "Args",
                value: [
                  "**user**: the user to add",
                  "**level**: the permission level to add",
                ].join("\n"),
              },
            ],
          },
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config core grantUser {role}', function () {
    beforeEach(function () {
      this.args.role = "testRole";
    });

    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');

      this.test$.pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.test$.pipe(
        tap((response) => expect(response).to.containSubset({
          content: "I'm sorry, but I'm missing some information for that command:",
          embed: {
            title: "grantUser",
            description: "Add a user to a permission level.",
            fields: [
              {
                name: "Usage",
                value: '!config core grantUser <user> <level>',
              },
              {
                name: "Args",
                value: [
                  "**user**: the user to add",
                  "**level**: the permission level to add",
                ].join("\n"),
              },
            ],
          },
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config core grantUser {user} {level}', function () {
    context('when the level does not exist', function () {
      beforeEach(function () {
        this.args.user = userId;
        this.args.level = "nullLevel";
      });

      it('displays an error message', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            content: "The permission level 'nullLevel' could not be found.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the user does not exist', function () {
      beforeEach(function () {
        this.args.user = `nullUser`;
        this.args.level = "nullLevel";
      });

      it('displays an error message', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            content: "The user 'nullUser' could not be found",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the user and level exist', function () {
      [{
        paramType: "userId",
        paramValue: userId,
      }, {
        paramType: "user tag",
        paramValue: "testUser#0001",
      }, {
        paramType: "user username",
        paramValue: "testUser",
      }, {
        paramType: "user nickname",
        paramValue: "testNickname",
      }, {
        paramType: "user mention",
        paramValue: `<@${userId}>`,
      }, {
        paramType: "user mobile mention",
        paramValue: `<@!${userId}>`,
      }].forEach(({ paramType, paramValue }) => {
        context(`when the user is given by ${paramType}`, function () {
          beforeEach(function () {
            this.args.user = paramValue;
            this.args.level = "testLevel";
          });

          it('displays an success message', function (done) {
            this.test$.pipe(
              tap((response) => expect(response).to.containSubset({
                content: "Added testUser to testLevel",
              })),
            ).subscribe(() => done(), (error) => done(error));
          });

          it('adds the member to the permission level', function (done) {
            const permissionsService = this.chaos.getService('core', 'PermissionsService');
            sinon.spy(permissionsService, 'addUser');

            this.test$.pipe(
              tap(() => expect(permissionsService.addUser).to.have.been.calledWith(
                this.message.guild, 'testLevel', this.member.user,
              )),
            ).subscribe(() => done(), (error) => done(error));
          });
        });
      });
    });
  });
});