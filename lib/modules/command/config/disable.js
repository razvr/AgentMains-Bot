module.exports = {
  name: 'disable',
  description: 'explicitly disable a command',
  inputs: [
    {
      name: 'command',
      required: true,
    },
  ],
  run: (context, response) => {
    let cmdManager = context.nix.commandManager;
    let commandName = context.args.input1;
    let guild = context.guild;

    return cmdManager.disableCommand(guild.id, commandName)
      .flatMap((isEnabled) => {
        response.type = 'message';
        response.content = isEnabled ? `Unable to disable ${commandName}` : `${commandName} has been disabled`;
        return response.send();
      })
      .catch((error) => {
        if (error.message === `Command does not exist`) {
          response.type = 'message';
          response.content = `${commandName} does not exist`;
          return response.send();
        }
        if (error.message === `Command can not be disabled`) {
          response.type = 'message';
          response.content = `${commandName} can not be disabled`;
          return response.send();
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
