module.exports = {
  name: 'enable',
  description: 'enable a command. Does not override disabled modules.',
  inputs: [
    {
      name: 'command',
      required: true,
      type: 'string',
      description: 'The name of the command to enable',
    },
  ],

  run: (context, response) => {
    let cmdManager = context.nix.commandService;
    let commandName = context.args.input1;

    let guild = context.guild;

    return cmdManager.enableCommand(guild.id, commandName)
      .flatMap((isEnabled) => {
        response.type = 'message';
        response.content = isEnabled ? `${commandName} has been enabled` : `Unable to enable ${commandName}`;
        return response.send();
      })
      .catch((error) => {
        if (error.message === `Command does not exist`) {
          response.type = 'message';
          response.content = `${commandName} does not exist`;
          return response.send();
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
