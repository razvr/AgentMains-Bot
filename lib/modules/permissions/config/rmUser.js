const {findUser, PermissionsManager} = require('../utility');

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
  run: (context, response) => {
    let guild = context.guild;
    let userString = context.args.input1;
    let level = context.args.input2;

    if (!userString) {
      return response.send({content: `the user to remove is required`});
    }

    if (!level) {
      return response.send({content: `the permission level to add is required`});
    }


    let user = findUser(userString, context);
    if (!user) {
      response.content = `User ${userString} could not be found.`;
      return response.send();
    }

    return context.nix.permissionsManager
      .removeUser(guild, level, user)
      .map((saved) => {
        if (saved) {
          response.content = `Removed ${user} from ${level}`;
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
          response.content = `${user} is not in ${level}`;
          return response.send();
        }

        throw error;
      });
  },
};
