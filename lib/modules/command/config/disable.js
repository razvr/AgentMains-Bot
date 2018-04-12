const Rx = require('rx');

module.exports = {
  name: 'disable',
  description: 'explicitly disable a command',

  services: {
    core: [
      'commandService',
    ],
  },

  inputs: [
    {
      name: 'command',
      required: true,
      type: 'string',
      description: 'The name of the command to disable',
    },
  ],

  run (context) {
    let commandName = context.inputs.command;
    let guild = context.guild;

    return this.commandService.disableCommand(guild.id, commandName)
      .map((isEnabled) => {
        if (!isEnabled) {
          return {
            status: 200,
            content: `${commandName} has been disabled`,
          };
        }
        else {
          return {
            status: 500,
            content: `Unable to disable ${commandName}`,
          };
        }
      })
      .catch((error) => {
        if (error.message === `Command does not exist`) {
          return Rx.Observable.of({
            status: 400,
            content: `${commandName} does not exist`,
          });
        }
        if (error.message === `Required command can not be disabled`) {
          return Rx.Observable.of({
            status: 400,
            content: `${commandName} can not be disabled`,
          });
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
