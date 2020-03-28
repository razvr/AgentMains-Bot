const { of, throwError } = require('rxjs');
const { map, catchError } = require('rxjs/operators');

const ConfigAction = require("../../../models/config-action");

class DisableCommandAction extends ConfigAction {
  name = 'disableCmd';
  description = "Explicitly disable a command.";

  args = [
    {
      name: 'command',
      description: 'The name of the command to disable',
      required: true,
      type: 'string',
    },
  ];

  constructor(chaos) {
    super(chaos);

    this.chaos.on('chaos.listen', () => {
      this.commandService = this.chaos.getService('core', 'commandService');
    });
  }

  get strings() {
    return this.chaos.strings.core.configActions.commands.disableCmd;
  }

  run(context) {
    let commandName = context.args.command;
    let guild = context.guild;

    return this.commandService.disableCommand(guild.id, commandName).pipe(
      map((isEnabled) => {
        if (!isEnabled) {
          return {
            status: 200,
            content: this.strings.hasBeenDisabled({ commandName }),
          };
        } else {
          return {
            status: 500,
            content: this.strings.unableToDisable({ commandName }),
          };
        }
      }),
      catchError((error) => {
        switch (error.name) {
          case 'DisableCommandError':
            return of({ status: 500, content: error.message });
          case 'PluginDisabledError':
          case 'CommandNotFoundError':
          case 'ReqCommandError':
            return of({ status: 400, content: error.message });
          default:
            return throwError(error);
        }
      }),
    );
  }
}

module.exports = DisableCommandAction;
