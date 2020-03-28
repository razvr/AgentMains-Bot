const { tap } = require('rxjs/operators');
const { SnowflakeUtil } = require('discord.js');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.grantRole', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'grantRole');
    this.message = new MockMessage();
    this.args = {};
    this.test$ = this.chaos.testConfigAction({
      pluginName: 'core',
      actionName: 'grantRole',
      message: this.message,
      args: this.args,
    });

    this.chaos.addPlugin({
      name: "test",
      permissions: ['testLevel'],
    });

    this.role = {
      id: SnowflakeUtil.generate(),
      name: "testRole",
    };
    this.message.guild.roles.set(this.role.id, this.role);
  });

  describe('!config core grantRole', function () {
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
            title: "grantRole",
            description: "Add a role to a permission level.",
            fields: [
              {
                name: "Usage",
                value: '!config core grantRole <role> <level>',
              },
              {
                name: "Args",
                value: [
                  "**role**: the name or mention of the role to add",
                  "**level**: the permission level to add",
                ].join("\n"),
              },
            ],
          },
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config core grantRole {role}', function () {
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
            title: "grantRole",
            description: "Add a role to a permission level.",
            fields: [
              {
                name: "Usage",
                value: '!config core grantRole <role> <level>',
              },
              {
                name: "Args",
                value: [
                  "**role**: the name or mention of the role to add",
                  "**level**: the permission level to add",
                ].join("\n"),
              },
            ],
          },
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config core grantRole {role} {level}', function () {
    context('when the level does not exist', function () {
      beforeEach(function () {
        this.args.role = "testRole";
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

    context('when the role does not exist', function () {
      beforeEach(function () {
        this.args.role = "nullRole";
        this.args.level = "testLevel";
      });

      it('displays an error message', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            content: "The role 'nullRole' could not be found",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the role and level exist', function () {
      beforeEach(function () {
        this.args.role = "testRole";
        this.args.level = "testLevel";
      });

      it('displays an success message', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            content: "Added `testRole` to `testLevel`.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('adds the role to the permission level', function (done) {
        const permissionsService = this.chaos.getService('core', 'PermissionsService');
        sinon.spy(permissionsService, 'addRole');

        this.test$.pipe(
          tap(() => expect(permissionsService.addRole).to.have.been.calledWith(
            this.message.guild, 'testLevel', this.role,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
