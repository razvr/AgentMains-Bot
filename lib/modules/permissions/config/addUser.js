const {findUser, ERRORS} = require('../utility');

module.exports = {
  name: 'addUser',
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

  run: (context, response) => {
    let guild = context.guild;
    let userString = context.args.input1;
    let level = context.args.input2;

    if (!userString) {
      return response.send({content: `the user to add is required`});
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
      .addUser(guild, level, user)
      .map((saved) => {
        if (saved) {
          response.content = `Added ${user.username} to ${level}`;
        }
        else {
          response.content = `Unable to update permissions`;
        }

        return response.send();
      })
      .catch((error) => {
        if (error.message === ERRORS.LEVEL_NOT_FOUND) {
          response.content = `Permission level ${level} is not available.`;
          return response.send();
        }
        else if (error.message === ERRORS.HAS_PERMISSION) {
          response.content = `${user.username} already has ${level}`;
          return response.send();
        }

        throw error;
      });
  },
};
