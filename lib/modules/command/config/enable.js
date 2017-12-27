module.exports = {
  name: 'enable',
  run: (context, response) => {
    let cmdManager = context.nix.commandManager;
    let commandName = context.args.input1;

    return cmdManager.enableCommand(context, commandName)
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
