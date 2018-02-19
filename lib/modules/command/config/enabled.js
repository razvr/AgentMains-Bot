module.exports = {
  name: 'enabled?',
  description: 'check if a command is enabled',
  inputs: [
    {
      name: 'command',
      required: true,
      type: 'string',
      description: 'The name of the command to check',
    },
  ],

  run: (context, response) => {
    let cmdManager = context.nix.commandService;
    let commandName = context.args.input1;

    return cmdManager.isCommandEnabled(context.guild.id, commandName)
      .flatMap((isEnabled) => {
        response.type = 'message';
        response.content = `command ${commandName} ${isEnabled ? 'is enabled' : 'is disabled'}.`;
        return response.send();
      });
  },
};
