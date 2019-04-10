const Rx = require('rx');
const { RoleNotFoundError } = require("../../../../errors");

module.exports = {
  name: 'grantRole',
  description: 'Add a role to a permission level',

  inputs: [
    {
      name: 'role',
      description: 'the name or mention of the role to add',
      required: true,
    },
    {
      name: 'level',
      description: 'the permission level to add',
      required: true,
    },
  ],

  configureAction() {
    this.permissionsService = this.nix.getService('core', 'permissionsService');
    this.roleService = this.nix.getService('core', 'roleService');
  },

  run(context) {
    let guild = context.guild;

    let roleString = context.inputs.role;
    let level = context.inputs.level;

    if (!roleString) {
      return Rx.Observable.of({
        status: 400,
        content: `the role to add is required`,
      });
    }

    if (!level) {
      return Rx.Observable.of({
        status: 400,
        content: `the permission level to add is required`,
      });
    }

    return Rx.Observable.of('')
      .flatMap(() => this.roleService.findRole(context.guild, roleString))
      .flatMap((role) => this.permissionsService.addRole(guild, level, role).map(() => role))
      .map((role) => ({
        status: 200,
        content: `Added ${role.name} to ${level}`,
      }))
      .catch((error) => {
        if (error instanceof RoleNotFoundError) {
          return Rx.Observable.of({ status: 400, content: error.message });
        } else if (error.name === "PermLevelError") {
          return Rx.Observable.of({ status: 400, content: error.message });
        } else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
