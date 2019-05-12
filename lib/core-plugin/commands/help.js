const { from, of } = require('rxjs');
const { flatMap, toArray, tap, mapTo } = require('rxjs/operators');

module.exports = {
  name: 'help',
  description: 'See all commands that I can do',

  onListen() {
    this.commandService = this.chaos.getService('core', 'commandService');
    this.permissionsService = this.chaos.getService('core', 'permissionsService');

    this.commandManager = this.chaos.commandManager;
  },

  run(context, response) {
    response.type = 'embed';
    response.content =
      "Here's everything that I can do for you. If you want more help on a " +
      "specific command, add '--help' to the command";

    return from(this.commandManager.commands).pipe(
      flatMap((command) => this.filterCommandAllowed(context, command)),
      toArray(),
      tap((allowedCommands) => this.buildHelpEmbed(context.guild, allowedCommands, response)),
      flatMap(() => response.send()),
    );
  },

  buildHelpEmbed(guild, allowedCommands, response) {
    let commandsByPlugin = {};

    allowedCommands.forEach((command) => {
      if (!commandsByPlugin[command.pluginName]) {
        commandsByPlugin[command.pluginName] = [];
      }

      commandsByPlugin[command.pluginName].push(command);
    });

    Object.entries(commandsByPlugin).forEach(([pluginName, commands]) => {
      let prefix = this.commandService.getPrefix(guild.id);
      let commandList = [];

      commands.forEach((command) => {
        commandList.push(`*${prefix}${command.name}*\n${command.description}`);
      });

      response.embed.addField(pluginName, commandList.join('\n'));
    });
  },

  filterCommandAllowed(context, command) {
    return of(command).pipe(
      flatMap(() => this.commandService.filterCommandEnabled(context.guild.id, command.name)),
      flatMap(() => this.commandService.filterHasPermission(context, command.name)),
      mapTo(command),
    );
  },
};


