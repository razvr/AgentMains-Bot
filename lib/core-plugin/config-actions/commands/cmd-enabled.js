const { of, throwError } = require('rxjs');
const { map, catchError } = require('rxjs/operators');

const ConfigAction = require("../../../models/config-action");

class CommandIsEnabledAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: 'cmdEnabled?',
      description: 'check if a command is enabled',

      args: [
        {
          name: 'command',
          required: true,
          type: 'string',
          description: 'The name of the command to check',
        },
      ],
    });

    this.chaos.on('chaos.listen', () => {
      this.commandService = this.getService('core', 'commandService');
    });
  }

  get strings() {
    return this.chaos.strings.core.configActions.commands.cmdEnabled;
  }

  run(context) {
    let commandName = context.args.command;

    return this.commandService.isCommandEnabled(context.guild.id, commandName).pipe(
      map((isEnabled) => {
        return {
          status: 200,
          content: (
            isEnabled
              ? this.strings.isEnabled({ commandName })
              : this.strings.isDisabled({ commandName })
          ),
        };
      }),
      catchError((error) => {
        if (error.name === "PluginDisabledError") {
          return of({ status: 400, content: error.message });
        } else if (error.name === "CommandNotFoundError") {
          return of({ status: 400, content: error.message });
        } else {
          return throwError(error);
        }
      }),
    );
  }
}

module.exports = CommandIsEnabledAction;
