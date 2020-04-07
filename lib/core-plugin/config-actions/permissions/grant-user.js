const { of, throwError } = require('rxjs');
const { flatMap, map, catchError } = require('rxjs/operators');

const ConfigAction = require("../../../models/config-action");
const { ChaosError } = require("../../../errors");

class GrantUserAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: 'grantUser',
      description: 'Add a user to a permission level.',

      args: [
        {
          name: "user",
          description: "the user to add",
          required: true,
        },
        {
          name: "level",
          description: "the permission level to add",
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
    return this.chaos.strings.core.configActions.permissions.grantUser;
  }

  run(context) {
    let guild = context.guild;
    let userString = context.args.user;
    let level = context.args.level;

    return of('').pipe(
      flatMap(() => this.userService.findMember(guild, userString)),
      map((member) => member.user),
      flatMap((user) => this.permissionsService.addUser(guild, level, user).pipe(
        map(() => user),
      )),
      map((user) => ({
        status: 200,
        content: this.strings.addedUserToLevel({ userName: user.username, levelName: level }),
      })),
      catchError((error) => {
        if (error instanceof ChaosError) {
          return of({ status: 400, content: error.message });
        } else {
          return throwError(error);
        }
      }),
    );
  }
}

module.exports = GrantUserAction;
