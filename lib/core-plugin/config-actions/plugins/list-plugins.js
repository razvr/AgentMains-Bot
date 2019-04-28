const { from } = require('rxjs');
const { flatMap, map, toArray } = require('rxjs/operators');

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

    return from(this.chaos.pluginManager.plugins).pipe(
      flatMap((plugin) => this.pluginService.isPluginEnabled(guild.id, plugin.name).pipe(
        map((enabled) => [plugin, enabled]),
      )),
      map(([plugin, enabled]) => {
        return {
          name: plugin.name + (enabled ? "" : " (disabled)"),
          value: plugin.description ? plugin.description : '*[No description]*',
        };
      }),
      toArray(),
      map((fields) => {
        const embed = new Discord.RichEmbed();
        embed.fields = fields;
        return embed;
      }),
      map((embed) => {
        return {
          status: 200,
          content: `Here are all my current plugins:`,
          embed: embed,
        };
      }),
    );
  },
};
