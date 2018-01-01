module.exports = {
  name: 'setPrefix',
  description: 'change the prefix for this guild',
  inputs: [
    {
      name: 'prefix',
      required: true,
    },
  ],

  run: (context, response) => {
    let commandManager = context.nix.commandManager;
    let prefix = context.args.input1;

    return commandManager
      .setPrefix(context, prefix)
      .flatMap((newPrefix) => {
        response.type = 'message';
        response.content = `${newPrefix} is now the command prefix`;
        return response.send();
      });
  },
};
