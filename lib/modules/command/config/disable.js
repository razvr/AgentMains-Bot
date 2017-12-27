module.exports = {
  name: 'disable',
  run: (context, response) => {
    let cmdManager = context.nix.commandManager;
    let commandName = context.args.input1;

    return cmdManager.disableCommand(context, commandName)
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
