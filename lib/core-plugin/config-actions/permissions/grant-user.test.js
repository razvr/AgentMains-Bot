const { tap, flatMap } = require('rxjs/operators');
const { SnowflakeUtil } = require('discord.js');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.grantUser', function () {
  const userId = SnowflakeUtil.generate();

  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'grantUser');
    this.message = new MockMessage({});

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

    this.chaos.listen().pipe(
      flatMap(() => this.chaos.getService('core', 'PermissionsService')
        .addUser(this.message.guild, 'admin', this.message.author)),
      flatMap(() => this.chaos.getService('core', 'PluginService')
        .enablePlugin(this.message.guild.id, 'test')),
    ).subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  describe('!config core grantUser', function () {
    beforeEach(function () {
      this.message.content = '!config core grantUser';
    });

    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');
      this.chaos.testCmdMessage(this.message).pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.chaos.testCmdMessage(this.message).pipe(
        tap(({ response }) => expect(response.replies).to.have.length(1)),
        tap(({ response }) => expect(response.replies[0]).to.containSubset({
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
                name: "Inputs",
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
      this.message.content = '!config core grantUser testRole';
    });

    it('does not run the action', function (done) {
      sinon.spy(this.action, 'run');
      this.chaos.testCmdMessage(this.message).pipe(
        tap(() => expect(this.action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('displays a help message', function (done) {
      this.chaos.testCmdMessage(this.message).pipe(
        tap(({ response }) => expect(response.replies).to.have.length(1)),
        tap(({ response }) => expect(response.replies[0]).to.containSubset({
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
                name: "Inputs",
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
        this.message.content = `!config core grantUser ${userId} nullLevel`;
      });

      it('displays an error message', function (done) {
        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "The permission level 'nullLevel' could not be found.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the user does not exist', function () {
      beforeEach(function () {
        this.message.content = '!config core grantUser nullUser testLevel';
      });

      it('displays an error message', function (done) {
        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
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
            this.message.content = `!config core grantUser ${paramValue} testLevel`;
          });

          it('displays an success message', function (done) {
            this.chaos.testCmdMessage(this.message).pipe(
              tap(({ response }) => expect(response.replies).to.have.length(1)),
              tap(({ response }) => expect(response.replies[0]).to.containSubset({
                content: "Added testUser to testLevel",
              })),
            ).subscribe(() => done(), (error) => done(error));
          });

          it('adds the member to the permission level', function (done) {
            const permissionsService = this.chaos.getService('core', 'PermissionsService');
            sinon.spy(permissionsService, 'addUser');

            this.chaos.testCmdMessage(this.message).pipe(
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