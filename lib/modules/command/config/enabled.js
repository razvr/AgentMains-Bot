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

  run: (context) => {
    let cmdManager = context.nix.commandService;
    let commandName = context.args.input1;

    return cmdManager.isCommandEnabled(context.guild.id, commandName)
      .map((isEnabled) => {
        return {
          status: 200,
          content: `command ${commandName} ${isEnabled ? 'is enabled' : 'is disabled'}.`,
        };
      });
  },
};
