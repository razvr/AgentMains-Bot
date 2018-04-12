const Rx = require('rx');

const {ERRORS} = require('../utility');

module.exports = {
  name: 'rmUser',
  description: 'remove a user from a permission level',

  services: {
    core: [
      'permissionsService',
      'userService',
    ],
  },

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
  run(context) {
    let guild = context.guild;
    let userString = context.args.input1;
    let level = context.args.input2;

    if (!userString) {
      return Rx.Observable.of({
        status: 400,
        content: `the user to remove is required`,
      });
    }

    if (!level) {
      return Rx.Observable.of({
        status: 400,
        content: `the permission level to add is required`,
      });
    }

    return this.userService
      .findMember(guild, userString)
      .map((member) => {
        if (!member) {
          let error = new Error(`User '${userString}' could not be found`);
          error.name = "UserNotFoundError";
          throw error;
        }
        return member;
      })
      .map((member) => member.user)
      .flatMap((user) => this.permissionsService.removeUser(guild, level, user).map(() => user))
      .map((user) => ({
        status: 200,
        content: `Removed ${user.username} from ${level}`,
      }))
      .catch((error) => {
        switch (error.name) {
          case "UserNotFoundError":
            return Rx.Observable.of({status: 400, content: error.message});
          default:
            break; // and check the error's message
        }

        switch (error) {
          case ERRORS.LEVEL_NOT_FOUND:
            return Rx.Observable.of({
              status: 400,
              content: `Permission level ${level} is not available.`,
            });
          case ERRORS.MISSING_PERMISSION:
            return Rx.Observable.of({
              status: 400,
              content: `That user is not in ${level}`,
            });
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
