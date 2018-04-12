module.exports = {
  name: 'enable',
  description: 'enable a command. Does not override disabled modules.',

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
      description: 'The name of the command to enable',
    },
  ],

  run: (context) => {
    let commandName = context.args.input1;

    let guild = context.guild;

    return this.commandService.enableCommand(guild.id, commandName)
      .map((isEnabled) => {
        if (isEnabled) {
          return {
            status: 200,
            message: `${commandName} has been enabled`,
          };
        }
        else {
          return {
            status: 500,
            message: `Unable to enable ${commandName}`,
          };
        }
      })
      .catch((error) => {
        if (error.message === `Command does not exist`) {
          return Rx.Observable.of({
            status: 400,
            message: `${commandName} does not exist`,
          });
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
