const { of, throwError } = require('rxjs');
const { flatMap, map, catchError } = require('rxjs/operators');

const { RoleNotFoundError } = require("../../../errors");
const ConfigAction = require("../../../models/config-action");

class RevokeRoleAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: 'revokeRole',
      description: 'removes a role from a permission level',

      args: [
        {
          name: 'role',
          description: 'the name or mention of the role to remove',
          required: true,
        },
        {
          name: 'level',
          description: 'the permission level to remove',
          required: true,
        },
      ],
    });

    this.chaos.on('chaos.listen', () => {
      this.permissionsService = this.chaos.getService('core', 'permissionsService');
      this.roleService = this.chaos.getService('core', 'roleService');
    });
  }

  run(context) {
    let guild = context.guild;
    let roleString = context.args.role;
    let level = context.args.level;

    if (!roleString) {
      return of({
        status: 400,
        content: `The role to remove is required`,
      });
    }

    if (!level) {
      return of({
        status: 400,
        content: `The permission level to remove is required`,
      });
    }

    return of('').pipe(
      flatMap(() => this.roleService.findRole(context.guild, roleString)),
      flatMap((role) => this.permissionsService.removeRole(guild, level, role).pipe(
        map(() => role),
      )),
      map((role) => ({
        status: 200,
        content: `Removed ${role.name} from ${level}`,
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
  }
}

module.exports = RevokeRoleAction;
