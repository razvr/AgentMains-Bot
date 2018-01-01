const {findRole, PermissionsManager} = require('../utility');

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
  run: (context, response) => {
    let guild = context.guild;
    let roleString = context.args.input1;
    let level = context.args.input2;

    if (!roleString) {
      return response.send({content: `the role to remove is required`});
    }

    if (!level) {
      return response.send({content: `the permission level to remove is required`});
    }

    let role = findRole(roleString, context);
    if (!role) {
      response.content = `Role ${roleString} could not be found.`;
      return response.send();
    }

    return context.nix.permissionsManager
      .removeRole(guild, level, role)
      .map((saved) => {
        if (saved) {
          response.content = `Removed ${role} from ${level}`;
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
        else if (error.message === PermissionsManager.ERR_MISSING_PERMISSION) {
          response.content = `${role} is not in ${level}`;
          return response.send();
        }

        throw error;
      });
  },
};
