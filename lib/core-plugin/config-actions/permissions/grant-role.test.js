const { SnowflakeUtil } = require('discord.js');

const createChaosStub = require('../../../test/create-chaos-stub');
const { MockMessage } = require("../../../test/mocks/discord.mocks");

describe('Config: core.grantRole', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.action = this.chaos.getConfigAction('core', 'grantRole');
    this.message = new MockMessage();
    this.args = {};

    this.runTest = () => {
      return this.chaos.testConfigAction({
        pluginName: 'core',
        actionName: 'grantRole',
        message: this.message,
        args: this.args,
      }).toPromise();
    };

    this.chaos.addPlugin({
      name: "test",
      permissionLevels: ['testLevel'],
    });

    this.role = {
      id: SnowflakeUtil.generate(),
      name: "testRole",
    };
    this.message.guild.roles.set(this.role.id, this.role);
  });

  describe('!config core grantRole', function () {
    it('does not run the action', async function () {
      sinon.spy(this.action, 'run');
      await this.runTest();
      expect(this.action.run).not.to.have.been.called;
    });

    it('displays a help message', async function () {
      let response = await this.runTest();
      expect(response).to.containSubset({
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
      });
    });
  });

  describe('!config core grantRole {role}', function () {
    beforeEach(function () {
      this.args.role = "testRole";
    });

    it('does not run the action', async function () {
      sinon.spy(this.action, 'run');
      await this.runTest();
      expect(this.action.run).not.to.have.been.called;
    });

    it('displays a help message', async function () {
      let response = await this.runTest();
      expect(response).to.containSubset({
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
      });
    });
  });

  describe('!config core grantRole {role} {level}', function () {
    context('when the level does not exist', function () {
      beforeEach(function () {
        this.args.role = "testRole";
        this.args.level = "nullLevel";
      });

      it('displays an error message', async function () {
        let response = await this.runTest();
        expect(response).to.containSubset({
          content: "The permission level 'nullLevel' could not be found.",
        });
      });
    });

    context('when the role does not exist', function () {
      beforeEach(function () {
        this.args.role = "nullRole";
        this.args.level = "testLevel";
      });

      it('displays an error message', async function () {
        let response = await this.runTest();
        expect(response).to.containSubset({
          content: "The role 'nullRole' could not be found",
        });
      });
    });

    context('when the role and level exist', function () {
      beforeEach(function () {
        this.args.role = "testRole";
        this.args.level = "testLevel";
      });

      it('displays an success message', async function () {
        let response = await this.runTest();
        expect(response).to.containSubset({
          content: "Added `testRole` to `testLevel`.",
        });
      });

      it('adds the role to the permission level', async function () {
        const permissionsService = this.chaos.getService('core', 'PermissionsService');
        sinon.spy(permissionsService, 'addRole');

        await this.runTest();
        expect(permissionsService.addRole).to.have.been.calledWith(
          this.message.guild, 'testLevel', this.role,
        );
      });
    });
  });
});
