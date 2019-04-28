const { of, throwError } = require('rxjs');
const { flatMap, map, catchError } = require('rxjs/operators');

const { UserNotFoundError } = require("../../../errors");

module.exports = {
  name: 'grantUser',
  description: 'Add a user to a permission level',

  inputs: [
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
        content: `the user to add is required`,
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
      flatMap((user) => this.permissionsService.addUser(guild, level, user).pipe(
        map(() => user),
      )),
      map((user) => ({
        status: 200,
        content: `Added ${user.username} to ${level}`,
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
