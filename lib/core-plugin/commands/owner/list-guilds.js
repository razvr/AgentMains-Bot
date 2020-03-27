module.exports = {
  name: 'listGuilds',
  description: 'list all servers the bot is connected to',
  ownerOnly: true,

  run(context, response) {
    let strings = this.chaos.strings.core.commands.owner.listGuilds;

    let guilds = this.chaos.discord.guilds
      .map((guild) => `- ${guild.name} (${guild.id})`);

    return response.send({ content: `${strings.inGuilds()}\n${guilds.join('\n')}` });
  },
};
