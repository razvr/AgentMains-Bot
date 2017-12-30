const Rx = require('rx');

module.exports = {
  name: 'list',
  run: (context, response) => {
    let cmdManager = context.nix.commandManager;
    let moduleManager = context.nix.moduleManager;
    let commands = Object.values(cmdManager.commands);

    return Rx.Observable
      .from(commands)
      .flatMap((command) =>
        Rx.Observable
          .concat([
            Rx.Observable.return(command),
            cmdManager.isCommandEnabled(context, command.name),
            moduleManager.isModuleEnabled(context.guild.id, command.moduleName),
          ])
          .toArray()
      )
      .toArray()
      .flatMap((commands) => {
        let enabledCommands = [];
        let disabledCommands = [];


        commands.forEach(([command, cmdEnabled, modEnabled]) => {
          if(cmdEnabled) {
            enabledCommands.push(`*${command.name}*\n\t${command.description}`);
          }
          else {
            let reasons = [];
            if (!modEnabled) { reasons.push(`module '${command.moduleName}' disabled`); }
            if (!cmdEnabled) { reasons.push(`explicitly disabled`); }

            disabledCommands.push(`*${command.name}* - ${reasons.join(' | ')}\n\t${command.description}`);
          }
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
