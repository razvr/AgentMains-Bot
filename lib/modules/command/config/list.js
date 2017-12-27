const Rx = require('rx');

module.exports = {
  name: 'list',
  run: (context, response) => {
    let cmdManager = context.nix.commandManager;
    let commands = Object.values(cmdManager.commands);

    return Rx.Observable
      .from(commands)
      .flatMap((command) =>
        cmdManager.isCommandEnabled(context, command.name)
          .map((isEnabled) => [command, isEnabled])
      )
      .toArray()
      .flatMap((commands) => {
        let enabledCommands = [];
        let disabledCommands = [];

        commands.forEach(([command, isEnabled]) => {
          let target = isEnabled ? enabledCommands : disabledCommands;
          target.push(`*${command.name}*\n\t${command.description}`);
        });

        let embed = {
          fields: [],
        };

        if (enabledCommands.length > 0) {
          embed.fields.push({
            name: "Enabled Commands:",
            value: enabledCommands.join('\n'),
          });
        }
        if (disabledCommands.length > 0) {
          embed.fields.push({
            name: "Disabled Commands:",
            value: disabledCommands.join('\n'),
          });
        }

        response.type = 'embed';
        response.content = 'Here are all my available commands:';
        response.embed = embed;
        return response.send();
      });
  },
};
