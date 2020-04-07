const { map } = require('rxjs/operators');

const ConfigAction = require("../../models/config-action");

class SetPrefixAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: 'setPrefix',
      description: 'Change the prefix for this server.',

      args: [
        {
          name: 'prefix',
          required: true,
          type: 'string',
          description: 'The new prefix to use for commands.',
        },
      ],
    });

    this.chaos.on('chaos.listen', () => {
      this.commandService = this.getService('core', 'commandService');
    });
  }

  get strings() {
    return this.chaos.strings.core.configActions.setPrefix;
  }

  run(context) {
    let prefix = context.args.prefix;

    return this.commandService.setPrefix(context, prefix).pipe(
      map((newPrefix) => {
        return {
          status: 200,
          content: this.strings.prefixChanged({ newPrefix }),
        };
      }),
    );
  }
}

module.exports = SetPrefixAction;
