const { tap, flatMap } = require('rxjs/operators/index');
const { SnowflakeUtil } = require('discord.js');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.grantRole', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'grantRole');
    this.message = new MockMessage({});

    this.chaos.addPlugin({
      name: "test",
      permissions: ['testLevel'],
    });

    this.role = {
      id: SnowflakeUtil.generate(),
      name: "testRole",
    };
    this.message.guild.roles.set(this.role.id, this.role);

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

  describe('!config core grantRole', function () {
    beforeEach(function () {
      this.message.content = '!config core grantRole';
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
            title: "grantRole",
            description: "Add a role to a permission level.",
            fields: [
              {
                name: "Usage",
                value: '!config core grantRole <role> <level>',
              },
              {
                name: "Inputs",
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
      this.message.content = '!config core grantRole testRole';
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
            title: "grantRole",
            description: "Add a role to a permission level.",
            fields: [
              {
                name: "Usage",
                value: '!config core grantRole <role> <level>',
              },
              {
                name: "Inputs",
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
        this.message.content = '!config core grantRole testRole nullLevel';
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

    context('when the role does not exist', function () {
      beforeEach(function () {
        this.message.content = '!config core grantRole nullRole testLevel';
      });

      it('displays an error message', function (done) {
        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "The role 'nullRole' could not be found",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the role and level exist', function () {
      beforeEach(function () {
        this.message.content = '!config core grantRole testRole testLevel';
      });

      it('displays an success message', function (done) {
        this.chaos.testCmdMessage(this.message).pipe(
          tap(({ response }) => expect(response.replies).to.have.length(1)),
          tap(({ response }) => expect(response.replies[0]).to.containSubset({
            content: "Added testRole to testLevel",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('adds the role to the permission level', function (done) {
        const permissionsService = this.chaos.getService('core', 'PermissionsService');
        sinon.spy(permissionsService, 'addRole');

        this.chaos.testCmdMessage(this.message).pipe(
          tap(() => expect(permissionsService.addRole).to.have.been.calledWith(
            this.message.guild, 'testLevel', this.role,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});