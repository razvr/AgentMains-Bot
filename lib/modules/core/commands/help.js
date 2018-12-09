const Rx = require('rx');

module.exports = {
  name: 'help',
  description: 'See all commands that I can do',

  configureCommand() {
    this.commandService = this.nix.getService('core', 'commandService');
    this.permissionsService = this.nix.getService('core', 'permissionsService');

    this.commandManager = this.nix.commandManager;
  },

  run (context, response) {
    response.type = 'embed';
    response.content = "Here's everything that I can do for you. If you want more help on a specific command, add '--help' to the command ";

    return Rx.Observable
      .from(this.commandManager.commands)
      .flatMap((command) => this.filterCommandAllowed(context, command))
      .toArray()
      .flatMap((allowedCommands) => {
        let commandsByModule = {};

        allowedCommands.forEach((command) => {
          if (!commandsByModule[command.moduleName]) {
            commandsByModule[command.moduleName] = [];
          }

          commandsByModule[command.moduleName].push(command);
        });

        Object.entries(commandsByModule).forEach(([moduleName, commands]) => {
          let prefix = this.commandService.getPrefix(context.guild.id);
          let commandList = [];

          commands.forEach((command) => {
            commandList.push(`*${prefix}${command.name}*\n${command.description}`);
          });

          response.embed.addField(moduleName, commandList.join('\n'));
        });

        return response.send();
      });
  },

  filterCommandAllowed(context, command) {
    return Rx.Observable
      .of(command)
      .flatMap(() => this.commandService.filterCommandEnabled(context.guild.id, command.name))
      .flatMap(() => this.commandService.filterHasPermission(context, command.name))
      .map(() => command);
  },
};


