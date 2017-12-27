const {findRole, PermissionsManager} = require('../utility');

module.exports = {
  name: 'addRole',
  run: (context, response) => {
    let guild = context.guild;
    let roleString = context.args.input1;
    let level = context.args.input2;

    let role = findRole(roleString, context);
    if (!role) {
      response.content = `Role ${roleString} could not be found.`;
      return response.send();
    }

    return context.nix.permissionsManager
      .addRole(guild, level, role)
      .map((saved) => {
        if (saved) {
          response.content = `Added ${role} to ${level}`;
        }
        else {
          response.content = `Unable to update permissions`;
        }

        return response.send();
      })
      .catch((error) => {
        if (error.message === PermissionsManager.ERR_LEVEL_NOT_FOUND) {
          response.content = `Level ${level} is not available.`;
          return response.send();
        }
        else if (error.message === PermissionsManager.ERR_HAS_PERMISSION) {
          response.content = `${role} already has ${level}`;
          return response.send();
        }

        throw error;
      });
  },
};
