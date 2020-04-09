const { of, throwError } = require('rxjs');
const { flatMap, map, catchError } = require('rxjs/operators');

const { UserNotFoundError } = require("../../../errors");
const ConfigAction = require("../../../models/config-action");

class RevokeUserAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: 'revokeUser',
      description: 'remove a user from a permission level',

      args: [
        {
          name: 'user',
          description: 'the user to remove',
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
      this.userService = this.getService('core', 'userService');
    });
  }

  get strings() {
    return this.strings.chaos.core.config.permissions.revokeUser;
  }

  run(context) {
    let guild = context.guild;
    let userString = context.args.user;
    let level = context.args.level;

    return of('').pipe(
      flatMap(() => this.userService.findMember(guild, userString)),
      map((member) => member.user),
      flatMap((user) => this.permissionsService.removeUser(guild, level, user).pipe(
        map(() => user),
      )),
      map((user) => ({
        status: 200,
        content: this.strings.removedUserFromLevel({ userName: user.username, levelName: level }),
      })),
      catchError((error) => {
        if (error instanceof UserNotFoundError) {
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

module.exports = RevokeUserAction;
