const Rx = require('rx');

module.exports = {
  name: 'list',
  description: 'list available permission levels',

  run(context, response) {
    response.type = 'embed';
    response.content = 'Here are the available permission levels:';
    response.embed.addField("Bot Owner*", context.nix.owner.tag);
    response.embed.addField("Guild Owner*", context.guild.owner.user.tag);
    response.embed.setFooter('* Unassignable');

    return Rx.Observable
      .from(context.nix.permissionsManager.levels)
      .flatMap((level) =>
        context.nix.permissionsManager
          .getPermissionsData(context.guild.id, level)
          .do((savedData) => savedData.name = level)
      )
      .map((level) => {
        let userList = level.users
          .map((id) => context.guild.members.get(id))
          .map((member) => member.user.tag)
          .join(', ');
        let roleList = level.roles
          .map((id) => context.guild.roles.get(id))
          .map((role) => role.name)
          .join(', ');

        response.embed.addField(level.name, `**Users**: ${userList}\n**Roles**: ${roleList}`);
      })
      .last()
      .flatMap(() => response.send());
  },
};
