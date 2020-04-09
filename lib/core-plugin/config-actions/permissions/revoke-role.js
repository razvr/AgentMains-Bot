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
      this.permissionsService = this.getService('core', 'permissionsService');
      this.roleService = this.getService('core', 'roleService');
    });
  }

  get strings() {
    return this.strings.chaos.core.config.permissions.revokeRole;
  }

  run(context) {
    let guild = context.guild;
    let roleString = context.args.role;
    let level = context.args.level;

    return of('').pipe(
      flatMap(() => this.roleService.findRole(context.guild, roleString)),
      flatMap((role) => this.permissionsService.removeRole(guild, level, role).pipe(
        map(() => role),
      )),
      map((role) => ({
        status: 200,
        content: this.strings.removedRoleFromLevel({ roleName: role.name, levelName: level }),
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
