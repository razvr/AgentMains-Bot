const {findRole, ERRORS} = require('../utility');

module.exports = {
  name: 'rmRole',
  description: 'removes a role from a permission level',
  inputs: [
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
  run: (context) => {
    let guild = context.guild;
    let roleString = context.args.input1;
    let level = context.args.input2;

    if (!roleString) {
      return Rx.Observable.of({
        status: 400,
        content: `The role to remove is required`,
      });
    }

    if (!level) {
      return Rx.Observable.of({
        status: 400,
        content: `The permission level to remove is required`,
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
      .removeRole(guild, level, role)
      .map((saved) => {
        if (saved) {
          return Rx.Observable.of({
            status: 200,
            content: `Removed ${role.name} from ${level}`,
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
            content: `${role.name} is not in ${level}`,
          });
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
