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
            cmdManager.isCommandEnabled(context.guild.id, command.name),
            moduleManager.isModuleEnabled(context.guild.id, command.moduleName),
          ])
          .toArray()
      )
      .toArray()
      .flatMap((commands) => {
        let enabledCmds = {};
        let disabledCmds = {};

        commands.forEach(([command, cmdEnabled, modEnabled]) => {
          if(cmdEnabled) {
            if (!enabledCmds[command.moduleName]) { enabledCmds[command.moduleName] = []; }
            enabledCmds[command.moduleName].push(`*${command.name}*\n\t\t${command.description}`);
          }
          else {
            if (!disabledCmds[command.moduleName]) { disabledCmds[command.moduleName] = []; }

            let reasons = [];
            if (!modEnabled) { reasons.push(`module '${command.moduleName}' disabled`); }
            else if (!cmdEnabled) { reasons.push(`explicitly disabled`); }

            disabledCmds[command.moduleName].push(`*${command.name}* - ${reasons.join(' | ')}\n\t\t${command.description}`);
          }
        });

        let embed = {
          fields: [],
        };

        if (Object.keys(enabledCmds).length > 0) {
          let enabledCmdList = [];
          Object.entries(enabledCmds).forEach(([moduleName, commands]) => {
            enabledCmdList.push(`**${moduleName}**\n\t${commands.join('\n\t')}`);
          });

          embed.fields.push({
            name: "Enabled Commands:",
            value: enabledCmdList.join('\n'),
          });
        }
        if (Object.keys(disabledCmds).length > 0) {
          let disabledCmdList = [];
          Object.entries(disabledCmds).forEach(([moduleName, commands]) => {
            disabledCmdList.push(`**${moduleName}**\n\t${commands.join('\n\t')}`);
          });

          embed.fields.push({
            name: "Disabled Commands:",
            value: disabledCmdList.join('\n'),
          });
        }

        response.type = 'embed';
        response.content = 'Here are all my available commands:';
        response.embed = embed;
        return response.send();
      });
  },
};
