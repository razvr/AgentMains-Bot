const { of, throwError } = require('rxjs');
const { map, catchError } = require('rxjs/operators');

module.exports = {
  name: 'enableCmd',
  description: 'enable a command. Does not override disabled plugins.',

  inputs: [
    {
      name: 'command',
      required: true,
      type: 'string',
      description: 'The name of the command to enable',
    },
  ],

  onListen() {
    this.commandService = this.chaos.getService('core', 'commandService');
  },

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
        if (error.name === 'CommandNotFoundError') {
          return of({ status: 400, content: error.message });
        } else {
          return throwError(error);
        }
      }),
    );
  },
};
