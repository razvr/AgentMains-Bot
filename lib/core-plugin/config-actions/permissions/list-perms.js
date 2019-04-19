const Rx = require('rx');
const Discord = require('discord.js');

module.exports = {
  name: 'listPerms',
  description: 'list available permission levels',

  onListen() {
    this.permissionsService = this.chaos.getService('core', 'permissionsService');
  },

  run(context) {
    let embed = new Discord.RichEmbed();
    embed.addField("Bot Owner\\*", context.chaos.owner.tag);
    embed.addField("Guild Owner\\*", context.guild.owner.user.tag);
    embed.setFooter('* bypasses permissions');

    return Rx.Observable
      .from(this.chaos.permissionsManager.levels)
      .flatMap((level) => Rx.Observable.zip(
        Rx.Observable.of(level),
        this.permissionsService.getPermissionsData(context.guild.id, level),
      ))
      .flatMap(([level, levelData]) => Rx.Observable.zip(
        Rx.Observable.of(level),
        Rx.Observable.from(levelData.users)
          .map((id) => context.guild.members.get(id))
          .map((member) => member.user.tag)
          .defaultIfEmpty('[None]')
          .toArray(),
        Rx.Observable.from(levelData.roles)
          .map((id) => context.guild.roles.get(id))
          .map((role) => role.name)
          .defaultIfEmpty('[None]')
          .toArray(),
      ))
      .do(([levelName, users, roles]) => {
        embed.addField(levelName, `**Users**: ${users.join(', ')}\n**Roles**: ${roles.join(', ')}`);
      })
      .last()
      .map(() => {
        return {
          status: 200,
          content: 'Here are the available permission levels:',
          embed: embed,
        };
      });
  },
};
