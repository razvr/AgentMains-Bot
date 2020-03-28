const { of, throwError } = require('rxjs');
const { flatMap, map, catchError } = require('rxjs/operators');

const ConfigAction = require("../../../models/config-action");
const { RoleNotFoundError, PermissionLevelNotFound } = require("../../../errors");

class GrantRoleAction extends ConfigAction {
  name = 'grantRole';
  description = 'Add a role to a permission level.';

  args = [
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
  ];

  constructor(chaos) {
    super(chaos);

    this.chaos.on('chaos.listen', () => {
      this.permissionsService = this.chaos.getService('core', 'permissionsService');
      this.roleService = this.chaos.getService('core', 'roleService');
    });
  }

  get strings() {
    return this.chaos.strings.core.configActions.permissions.grantRole;
  }

  run(context) {
    let guild = context.guild;

    let roleString = context.args.role;
    let level = context.args.level;

    return of('').pipe(
      flatMap(() => this.roleService.findRole(context.guild, roleString)),
      flatMap((role) => this.permissionsService.addRole(guild, level, role).pipe(
        map(() => role),
      )),
      map((role) => ({
        status: 200,
        content: this.strings.addedRoleToLevel({ roleName: role.name, levelName: level }),
      })),
      catchError((error) => {
        switch (true) {
          case error instanceof RoleNotFoundError:
          case error instanceof PermissionLevelNotFound:
            return of({ status: 400, content: error.message });
          default:
            return throwError(error);
        }
      }),
    );
  }
}

module.exports = GrantRoleAction;
