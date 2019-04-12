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

  configureAction() {
    this.commandService = this.chaos.getService('core', 'commandService');
  },

  run (context) {
    let prefix = context.inputs.prefix;

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
