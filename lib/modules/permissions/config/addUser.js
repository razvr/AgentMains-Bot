const {findUser, ERRORS} = require('../utility');

module.exports = {
  name: 'addUser',
  description: 'Add a user to a permission level',

  services: {
    core: [
      'permissionsService',
    ],
  },

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

  run: (context) => {
    let guild = context.guild;
    let userString = context.args.input1;
    let level = context.args.input2;

    if (!userString) {
      return Rx.Observable.of({
        status: 400,
        content: `the user to add is required`,
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

    return this.permissionsService
      .addUser(guild, level, user)
      .map((saved) => {
        if (saved) {
          return Rx.Observable.of({
            status: 200,
            content: `Added ${user.username} to ${level}`,
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
            content: `Permission level ${level} is not available.`,
          });
        }
        else if (error.message === ERRORS.HAS_PERMISSION) {
          return Rx.Observable.of({
            status: 400,
            content: `${user.username} already has ${level}`,
          });
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
