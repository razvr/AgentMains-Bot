const Rx = require('rx');

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

  configureAction() {
    this.permissionsService = this.chaos.getService('core', 'permissionsService');
    this.userService = this.chaos.getService('core', 'userService');
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
      .flatMap((user) => this.permissionsService.addUser(guild, level, user).map(() => user))
      .map((user) => ({
        status: 200,
        content: `Added ${user.username} to ${level}`,
      }))
      .catch((error) => {
        switch (error.name) {
          case "UserNotFoundError":
          case "PermLevelError":
            return Rx.Observable.of({ status: 400, content: error.message });
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
