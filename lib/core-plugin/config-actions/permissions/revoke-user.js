const { of } = require('rxjs');
const { flatMap, map, catchError, throwError } = require('rxjs/operators');

const { UserNotFoundError } = require("../../../errors");

module.exports = {
  name: 'revokeUser',
  description: 'remove a user from a permission level',

  inputs: [
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

  onListen() {
    this.permissionsService = this.chaos.getService('core', 'permissionsService');
    this.userService = this.chaos.getService('core', 'userService');
  },

  run(context) {
    let guild = context.guild;
    let userString = context.inputs.user;
    let level = context.inputs.level;

    if (!userString) {
      return of({
        status: 400,
        content: `the user to remove is required`,
      });
    }

    if (!level) {
      return of({
        status: 400,
        content: `the permission level to add is required`,
      });
    }

    return of('').pipe(
      flatMap(() => this.userService.findMember(guild, userString)),
      map((member) => member.user),
      flatMap((user) => this.permissionsService.removeUser(guild, level, user).pipe(
        map(() => user),
      )),
      map((user) => ({
        status: 200,
        content: `Removed ${user.username} from ${level}`,
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
  },
};
