const Command = require("../../models/command");

class HelpCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: 'help',
      description: 'See all commands that I can do',
    });

    this.chaos.on('chaos.listen', () => {
      this.commandService = this.getService('core', 'commandService');
      this.permissionsService = this.getService('core', 'permissionsService');

      this.commandManager = this.chaos.commandManager;
    });
  }

  get strings() {
    return this.chaos.strings.core.commands.help;
  }

  async run(context, response) {
    let allowedCommands = await this.getAllowedCommands(context);
    response.content = this.strings.whatICanDo({ helpFlag: "--help" });
    this.buildHelpEmbed(context.guild, allowedCommands, response);
    return response.send();
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

      commands
        .sort((a, b) => (a.name > b.name) ? 1 : -1)
        .forEach((command) => {
          commandList.push(`*${prefix}${command.name}*\n${command.description}`);
        });

      response.embed.addField(pluginName, commandList.join('\n'));
    });
  }

  async getAllowedCommands(context) {
    let allowedCommands = [];

    for (const command of this.commandManager.commands) {
      let allowed = await this.isCommandAllowed(context, command);
      if (allowed) { allowedCommands.push(command); }
    }

    return allowedCommands;
  }

  async isCommandAllowed(context, command) {
    try {
      let commandEnabled = await this.commandService.isCommandEnabled(context.guild.id, command.name).toPromise();
      let hasPerm = await this.permissionsService.hasPermission(context, command.name).toPromise();
      return commandEnabled && hasPerm;
    } catch (error) {
      if (error.name === "PluginDisabledError") {
        return false;
      } else {
        throw error;
      }
    }
  }
}

module.exports = HelpCommand;


