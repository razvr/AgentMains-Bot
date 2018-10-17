module.exports = {
  name: 'listGuilds',
  description: 'list all servers the bot is connected to',
  ownerOnly: true,

  run(context, response) {
    let guilds = this.nix
      .discord
      .guilds
      .map((guild) => `- ${guild.name} (${guild.id})`);

    return response.send({content: `I'm in the following guilds:\n${guilds.join('\n')}`});
  },
};
