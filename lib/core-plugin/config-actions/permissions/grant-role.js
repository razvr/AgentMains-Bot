const { of, throwError } = require('rxjs');
const { flatMap, map, catchError } = require('rxjs/operators');

const { RoleNotFoundError } = require("../../../errors");

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

  onListen() {
    this.permissionsService = this.chaos.getService('core', 'permissionsService');
    this.roleService = this.chaos.getService('core', 'roleService');
  },

  run(context) {
    let guild = context.guild;

    let roleString = context.inputs.role;
    let level = context.inputs.level;

    if (!roleString) {
      return of({
        status: 400,
        content: `the role to add is required`,
      });
    }

    if (!level) {
      return of({
        status: 400,
        content: `the permission level to add is required`,
      });
    }

    return of('').pipe(
      flatMap(() => this.roleService.findRole(context.guild, roleString)),
      flatMap((role) => this.permissionsService.addRole(guild, level, role).pipe(
        map(() => role),
      )),
      map((role) => ({
        status: 200,
        content: `Added ${role.name} to ${level}`,
      })),
      catchError((error) => {
        if (error instanceof RoleNotFoundError) {
          return of({ status: 400, content: error.message });
        } else if (error.name === "PermLevelError") {
          return of({ status: 400, content: error.message });
        } else {
          return throwError(error);
        }
      }),
    );
  },
};
