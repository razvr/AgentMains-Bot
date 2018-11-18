module.exports = {
  name: 'setPrefix',
  description: 'change the prefix for this guild',

  inputs: [
    {
      name: 'prefix',
      required: true,
      type: 'string',
      description: 'The new prefix to use',
    },
  ],

  configureCommand() {
    this.commandService = this.nix.getService('core', 'commandService');
  },

  run (context) {
    let prefix = context.args.input1;

    return this.commandService
      .setPrefix(context, prefix)
      .map((newPrefix) => {
        return {
          status: 200,
          content: `${newPrefix} is now the command prefix`,
        };
      });
  },
};
