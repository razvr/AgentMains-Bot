const Rx = require('rx');

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

  configureAction() {
    this.commandService = this.chaos.getService('core', 'commandService');
  },

  run(context) {
    let commandName = context.inputs.command;

    return this.commandService
      .isCommandEnabled(context.guild.id, commandName)
      .map((isEnabled) => {
        return {
          status: 200,
          content: `command ${commandName} ${isEnabled ? 'is enabled' : 'is disabled'}.`,
        };
      })
      .catch((error) => {
        if (error.name === "CommandNotFoundError") {
          return Rx.Observable.of({ status: 400, content: error.message });
        } else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
