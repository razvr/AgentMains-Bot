const { from, throwError, merge, of } = require('rxjs');
const { flatMap, toArray, tap, mapTo, every, filter, catchError } = require('rxjs/operators');

const Command = require("../../models/command");

class HelpCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: 'help',
      description: 'See all commands that I can do',
    });

    this.chaos.on('chaos.listen', () => {
      this.commandService = this.chaos.getService('core', 'commandService');
      this.permissionsService = this.chaos.getService('core', 'permissionsService');

      this.commandManager = this.chaos.commandManager;
    });
  }

  run(context, response) {
    response.type = 'embed';
    response.content =
      "Here's everything that I can do for you. If you want more help on a " +
      "specific command, add '--help' to the command";

    return from(this.commandManager.commands).pipe(
      flatMap((command) => this.isCommandAllowed(context, command).pipe(
        filter(Boolean),
        mapTo(command),
      )),
      toArray(),
      tap((allowedCommands) => this.buildHelpEmbed(context.guild, allowedCommands, response)),
      flatMap(() => response.send()),
    );
  }

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
  }

  isCommandAllowed(context, command) {
    return merge(
      this.commandService.isCommandEnabled(context.guild.id, command.name),
      this.permissionsService.hasPermission(context, command.name),
    ).pipe(
      every(Boolean),
      catchError((error) => {
        if (error.name === "PluginDisabledError") {
          return of(false);
        } else {
          return throwError(error);
        }
      }),
    );
  }
}

module.exports = HelpCommand;


