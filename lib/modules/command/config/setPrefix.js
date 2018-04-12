module.exports = {
  name: 'setPrefix',
  description: 'change the prefix for this guild',

  services: {
    core: [
      'commandService',
    ],
  },

  inputs: [
    {
      name: 'prefix',
      required: true,
      type: 'string',
      description: 'The new prefix to use',
    },
  ],

  run: (context) => {
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
