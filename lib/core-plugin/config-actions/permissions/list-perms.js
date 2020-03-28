const Discord = require('discord.js');
const { from, of, zip } = require('rxjs');
const { flatMap, last, tap, mapTo, map, defaultIfEmpty, toArray } = require('rxjs/operators');

const ConfigAction = require("../../../models/config-action");

class ListPermissionsAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: 'listPerms',
      description: 'list available permission levels',
    });

    this.chaos.on('chaos.listen', () => {
      this.permissionsService = this.chaos.getService('core', 'permissionsService');
    });
  }

  get strings() {
    return this.chaos.strings.core.config.permissions.listPerms;
  }

  run(context) {
    let embed = new Discord.RichEmbed();
    embed.addField("Bot Owner\\*", this.chaos.owner.tag);
    embed.addField("Guild Owner\\*", context.guild.owner.user.tag);
    embed.setFooter('* bypasses permissions');

    return from(this.chaos.permissionsManager.levels).pipe(
      flatMap((level) => zip(
        of(level),
        this.permissionsService.getPermissionsData(context.guild.id, level),
      )),
      flatMap(([level, levelData]) => zip(
        of(level),
        from(levelData.users).pipe(
          map((id) => context.guild.members.get(id)),
          map((member) => member.user.tag),
          defaultIfEmpty('[None]'),
          toArray(),
        ),
        from(levelData.roles).pipe(
          map((id) => context.guild.roles.get(id)),
          map((role) => role.name),
          defaultIfEmpty('[None]'),
          toArray(),
        ),
      )),
      tap(([levelName, users, roles]) => {
        embed.addField(
          levelName,
          `**Users**: ${users.join(', ')}\n**Roles**: ${roles.join(', ')}`);
      }),
      last(null, ''),
      mapTo({
        status: 200,
        content: this.strings.availablePermissions(),
        embed: embed,
      }),
    );
  }
}

module.exports = ListPermissionsAction;
