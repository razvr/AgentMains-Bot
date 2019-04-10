const Rx = require('rx');
const { UserNotFoundError } = require("../../../../errors");

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

  configureAction() {
    this.permissionsService = this.nix.getService('core', 'permissionsService');
    this.userService = this.nix.getService('core', 'userService');
  },

  run(context) {
    let guild = context.guild;
    let userString = context.inputs.user;
    let level = context.inputs.level;

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

    return Rx.Observable.of('')
      .flatMap(() => this.userService.findMember(guild, userString))
      .map((member) => member.user)
      .flatMap((user) => this.permissionsService.addUser(guild, level, user).map(() => user))
      .map((user) => ({
        status: 200,
        content: `Added ${user.username} to ${level}`,
      }))
      .catch((error) => {
        if (error instanceof UserNotFoundError) {
          return Rx.Observable.of({ status: 400, content: error.message });
        } else if (error.name === "PermLevelError") {
          return Rx.Observable.of({ status: 400, content: error.message });
        } else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
