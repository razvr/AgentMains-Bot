const Rx = require('rx');

module.exports = {
  name: 'enable',
  description: 'enable a command. Does not override disabled modules.',

  inputs: [
    {
      name: 'command',
      required: true,
      type: 'string',
      description: 'The name of the command to enable',
    },
  ],

  configureAction() {
    this.commandService = this.nix.getService('core', 'commandService');
  },

  run (context) {
    let commandName = context.inputs.command;
    let guild = context.guild;

    return this.commandService.enableCommand(guild.id, commandName)
      .map((isEnabled) => {
        if (isEnabled) {
          return {
            status: 200,
            content: `${commandName} has been enabled`,
          };
        }
        else {
          return {
            status: 500,
            content: `Unable to enable ${commandName}`,
          };
        }
      })
      .catch((error) => {
        switch (error.name) {
          case 'CommandNotFoundError':
            return Rx.Observable.of({ status: 400, content: error.message });
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
