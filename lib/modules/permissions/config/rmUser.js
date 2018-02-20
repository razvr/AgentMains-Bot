const {findUser, ERRORS} = require('../utility');

module.exports = {
  name: 'rmUser',
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
  run: (context) => {
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


    let user = findUser(userString, context);
    if (!user) {
      return Rx.Observable.of({
        status: 400,
        content: `User ${userString} could not be found.`,
      });
    }

    return context.nix.permissionsService
      .removeUser(guild, level, user)
      .map((saved) => {
        if (saved) {
          return Rx.Observable.of({
            status: 200,
            content: `Removed ${user.username} from ${level}`,
          });
        }
        else {
          return Rx.Observable.of({
            status: 500,
            content: `Unable to update permissions`,
          });
        }
      })
      .catch((error) => {
        if (error.message === ERRORS.LEVEL_NOT_FOUND) {
          return Rx.Observable.of({
            status: 400,
            content: `Level ${level} is not available.`,
          });
        }
        else if (error.message === ERRORS.MISSING_PERMISSION) {
          return Rx.Observable.of({
            status: 400,
            content: `${user.username} is not in ${level}`,
          });
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
