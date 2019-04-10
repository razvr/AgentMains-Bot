const Rx = require('rx');

module.exports = {
  name: 'listCmd',
  description: 'list all commands from all plugins',
  
  inputs: [],

  configureAction() {
    this.commandService = this.nix.getService('core', 'commandService');
    this.pluginService = this.nix.getService('core', 'pluginService');
  },

  run (context) {
    let commands = this.nix.commandManager.commands;

    return Rx.Observable
      .from(commands)
      .flatMap((command) =>
        Rx.Observable.zip(
          Rx.Observable.of(command),
          this.commandService.isCommandEnabled(context.guild.id, command.name),
          this.pluginService.isPluginEnabled(context.guild.id, command.pluginName),
        ),
      )
      .toArray()
      .map((commandData) => {
        let enabledCmds = {};
        let disabledCmds = {};

        commandData.forEach(([command, cmdEnabled, modEnabled]) => {
          if(cmdEnabled) {
            if (!enabledCmds[command.pluginName]) { enabledCmds[command.pluginName] = []; }
            enabledCmds[command.pluginName].push(`*${command.name}*\n${command.description}\n`);
          }
          else {
            if (!disabledCmds[command.pluginName]) { disabledCmds[command.pluginName] = []; }

            let reasons = [];
            if (!modEnabled) { reasons.push(`module '${command.pluginName}' disabled`); }
            else if (!cmdEnabled) { reasons.push(`explicitly disabled`); }

            disabledCmds[command.pluginName].push(`*${command.name}* - ${reasons.join(' | ')}\n${command.description}\n`);
          }
        });

        let embed = {
          fields: [],
        };

        if (Object.keys(enabledCmds).length > 0) {
          let enabledCmdList = [];
          Object.entries(enabledCmds).forEach(([pluginName, commands]) => {
            enabledCmdList.push(`**${pluginName}**\n\t${commands.join('\n\t')}`);
          });

          embed.fields.push({
            name: "Enabled Commands:",
            value: enabledCmdList.join('\n'),
          });
        }
        if (Object.keys(disabledCmds).length > 0) {
          let disabledCmdList = [];
          Object.entries(disabledCmds).forEach(([pluginName, commands]) => {
            disabledCmdList.push(`**${pluginName}**\n\t${commands.join('\n\t')}`);
          });

          embed.fields.push({
            name: "Disabled Commands:",
            value: disabledCmdList.join('\n'),
          });
        }

        return {
          status: 200,
          content: 'Here are all my available commands:',
          embed: embed,
        };
      });
  },
};
