const { map } = require('rxjs/operators');

module.exports = {
  name: 'setPrefix',
  description: 'Change the prefix for this server.',

  inputs: [
    {
      name: 'prefix',
      required: true,
      type: 'string',
      description: 'The new prefix to use for commands.',
    },
  ],

  onListen() {
    this.commandService = this.chaos.getService('core', 'commandService');
  },

  run(context) {
    let prefix = context.inputs.prefix;

    return this.commandService.setPrefix(context, prefix).pipe(
      map((newPrefix) => {
        return {
          status: 200,
          content: `${newPrefix} is now the command prefix.`,
        };
      }),
    );
  },
};
