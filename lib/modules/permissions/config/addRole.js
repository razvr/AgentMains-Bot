const {findRole, ERRORS} = require('../utility');

module.exports = {
  name: 'addRole',
  description: 'Add a role to a permission level',
  inputs: [
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
  ],
  run: (context) => {
    let guild = context.guild;
    let roleString = context.args.input1;
    let level = context.args.input2;

    if (!roleString) {
      return Rx.Observable.of({
        status: 400,
        content: `the role to add is required`,
      });
    }

    if (!level) {
      return Rx.Observable.of({
        status: 400,
        content: `the permission level to add is required`,
      });
    }

    let role = findRole(roleString, context);
    if (!role) {
      return Rx.Observable.of({
        status: 400,
        content: `Role ${roleString} could not be found.`,
      });
    }

    return context.nix.permissionsService
      .addRole(guild, level, role)
      .map((saved) => {
        if (saved) {
          return Rx.Observable.of({
            status: 200,
            content: `Added ${role.name} to ${level}`,
          });
        }
        else {
          return Rx.Observable.of({
            status: 200,
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
        else if (error.message === ERRORS.HAS_PERMISSION) {
          return Rx.Observable.of({
            status: 400,
            content: `${role.name} already has ${level}`,
          });
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
