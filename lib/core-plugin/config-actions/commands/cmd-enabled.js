const { of, throwError } = require('rxjs');
const { map, catchError } = require('rxjs/operators');

module.exports = {
  name: 'cmdEnabled?',
  description: 'check if a command is enabled',

  inputs: [
    {
      name: 'command',
      required: true,
      type: 'string',
      description: 'The name of the command to check',
    },
  ],

  onListen() {
    this.commandService = this.chaos.getService('core', 'commandService');
  },

  run(context) {
    let commandName = context.inputs.command;

    return this.commandService.isCommandEnabled(context.guild.id, commandName).pipe(
      map((isEnabled) => {
        return {
          status: 200,
          content: `command ${commandName} ${isEnabled ? 'is enabled' : 'is disabled'}.`,
        };
      }),
      catchError((error) => {
        if (error.name === "CommandNotFoundError") {
          return of({ status: 400, content: error.message });
        } else {
          return throwError(error);
        }
      }),
    );
  },
};
