const Rx = require('rx');
const Discord = require('discord.js');

module.exports = {
  name: "listPlugins",
  description: 'list all plugins',

  inputs: [],

  onListen() {
    this.pluginService = this.chaos.getService('core', 'pluginService');
  },

  run(context) {
    const guild = context.guild;

    return Rx.Observable.from(this.chaos.pluginManager.plugins)
      .flatMap((plugin) => this.pluginService.isPluginEnabled(guild.id, plugin.name)
        .map((enabled) => [plugin, enabled]))
      .map(([plugin, enabled]) => {
        let value = "";

        if (plugin.description) {
          value += `*${plugin.description}*\n`;
        } else {
          value += '*[No description]*\n';
        }

        if (plugin.commands.length > 0) {
          value += "**Commands:**\n";
          plugin.commands.forEach((command) => {
            value += `  - ${command.name}\n`;
          });
        }

        if (plugin.configActions.length > 0) {
          value += "**Config:**\n";
          plugin.configActions.forEach((configActions) => {
            value += `  - ${configActions.name}\n`;
          });
        }

        return {
          name: plugin.name + (enabled ? "" : " (disabled)"),
          value: value,
        };
      })
      .toArray()
      .map((fields) => {
        const embed = new Discord.RichEmbed();
        embed.fields = fields;
        return embed;
      })
      .map((embed) => {
        return {
          status: 200,
          content: `Here are all my current plugins:`,
          embed: embed,
        };
      });
  },
};
