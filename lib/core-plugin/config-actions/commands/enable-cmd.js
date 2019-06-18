const { of, throwError } = require('rxjs');
const { map, catchError } = require('rxjs/operators');

const ConfigAction = require("../../../models/config-action");

class EnableCommandAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: 'enableCmd',
      description: 'Enable a command. Does not override disabled plugins.',

      inputs: [
        {
          name: 'command',
          required: true,
          type: 'string',
          description: 'The name of the command to enable',
        },
      ],
    });

    this.chaos.on('chaos.listen', () => {
      this.commandService = this.chaos.getService('core', 'commandService');
    });
  }

  run(context) {
    let commandName = context.inputs.command;
    let guild = context.guild;

    return this.commandService.enableCommand(guild.id, commandName).pipe(
      map((isEnabled) => {
        if (isEnabled) {
          return {
            status: 200,
            content: `${commandName} has been enabled`,
          };
        } else {
          return {
            status: 500,
            content: `Unable to enable ${commandName}`,
          };
        }
      }),
      catchError((error) => {
        switch (error.name) {
          case 'EnableCommandError':
            return of({ status: 500, content: error.message });
          case 'PluginDisabledError':
          case 'CommandNotFoundError':
            return of({ status: 400, content: error.message });
          default:
            return throwError(error);
        }
      }),
    );
  }
}

module.exports = EnableCommandAction;
