const Rx = require('rx');

module.exports = {
  name: 'help',
  description: 'See all commands that I can do',
  scope: 'text',

  run (context, response) {
    let commandService = context.nix.commandService;

    response.type = 'embed';
    response.content = "Here's everything that I can do. If you want more help on a specific command, add '--help' to the command ";

    return Rx.Observable
      .from(Object.values(commandService.commands))
      .flatMap((command) => context.nix.commandService.filterCommandEnabled(context.guild.id, command.name).map(() => command))
      .flatMap((command) => context.nix.permissionsService.filterHasPermission(context, command.name).map(() => command))
      .toArray()
      .flatMap((allowedCommands) => {
        let commandsByModule = {};

        allowedCommands.forEach((command) => {
          if (!commandsByModule[command.moduleName]) { commandsByModule[command.moduleName] = []; }
          commandsByModule[command.moduleName].push(command);
        });

        Object.entries(commandsByModule).forEach(([moduleName, commands]) => {
          let prefix = context.nix.commandService.getPrefix(context.guild.id);
          let commandList = [];
          commands.forEach((command) => commandList.push(`*${prefix}${command.name}*\n\t${command.description}`));
          response.embed.addField(moduleName, commandList.join('\n'));
        });

        return response.send();
      });
  },
};
