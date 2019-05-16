const { from, of, throwError } = require('rxjs');
const { flatMap, toArray, map, catchError } = require('rxjs/operators');

module.exports = {
  name: 'listCmd',
  description: 'list all commands from all plugins',

  inputs: [],

  onListen() {
    this.commandService = this.chaos.getService('core', 'commandService');
    this.pluginService = this.chaos.getService('core', 'pluginService');
  },

  run(context) {
    let commands = this.chaos.commandManager.commands;

    return from(commands).pipe(
      flatMap((command) => of('').pipe(
        flatMap(() => this.commandService.isCommandEnabled(context.guild.id, command.name)),
        map((cmdEnabled) => [command, cmdEnabled, true]),
        catchError((error) => {
          if (error.name === `PluginDisabledError`) {
            return of([command, false, false]);
          } else {
            return throwError(error);
          }
        }),
      )),
      toArray(),
      map((commandData) => {
        let enabledCmds = {};
        let disabledCmds = {};

        commandData.forEach(([command, cmdEnabled, pluginEnabled]) => {
          if (cmdEnabled) {
            if (!enabledCmds[command.pluginName]) { enabledCmds[command.pluginName] = []; }
            enabledCmds[command.pluginName].push(`*${command.name}*\n${command.description}\n`);
          } else {
            if (!disabledCmds[command.pluginName]) { disabledCmds[command.pluginName] = []; }

            let reasons = [];
            if (!pluginEnabled) { reasons.push(`plugin '${command.pluginName}' disabled`); } else if (!cmdEnabled) { reasons.push(`explicitly disabled`); }

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
      }),
    );
  },
};
