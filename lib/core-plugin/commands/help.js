const { from, throwError, merge, of } = require('rxjs');
const { flatMap, map, toArray, mapTo, every, filter, catchError } = require('rxjs/operators');

const Command = require("../../models/command");

class HelpCommand extends Command {
  name = 'help';
  description = 'See all commands that I can do';

  constructor(chaos) {
    super(chaos);

    this.chaos.on('chaos.listen', () => {
      this.commandService = this.chaos.getService('core', 'commandService');
      this.permissionsService = this.chaos.getService('core', 'permissionsService');
      this.commandManager = this.chaos.commandManager;
    });
  }

  get strings() {
    return this.chaos.strings.core.commands.help;
  }

  run(context, response) {
    return from(this.commandManager.commands).pipe(
      flatMap((command) => this.isCommandAllowed(context, command).pipe(
        filter(Boolean),
        mapTo(command),
      )),
      toArray(),
      map((allowedCommands) => this.buildHelpList(context.guild, allowedCommands)),
      flatMap((helpList) => response.send({
        content: this.strings.whatICanDo({ helpFlag: "--help" }) + `\n\n${helpList}`,
      })),
    );
  }

  buildHelpList(guild, allowedCommands) {
    let prefix = this.commandService.getPrefix(guild.id);

    let commandsByPlugin = {};
    allowedCommands.forEach((command) => {
      if (!commandsByPlugin[command.pluginName]) {
        commandsByPlugin[command.pluginName] = [];
      }

      commandsByPlugin[command.pluginName].push(command);
    });

    let pluginLists = Object.entries(commandsByPlugin).map(([pluginName, commands]) => {
      let pluginCommands = `**${pluginName}**\n`;
      pluginCommands += commands.map((command) => (
        `> ${prefix}${command.name} \n ` +
        `>    *${command.description.replace('\n', '\n>    ')}*`
      )).join('\n');
      return pluginCommands;
    });

    return pluginLists.join('\n\n');
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


