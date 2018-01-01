const Rx = require('rx');
const Discord = require('discord.js');

const {addModLogEntry} = require('../utility');

module.exports = {
  name: 'unban',
  description: 'unban a user from the server',
  scope: ['text'],
  permissions: ['admin', 'mod'],
  args: [
    {
      name: 'user',
      description: 'The user to unban, by mention or user id',
      required: true,
    },
  ],

  run(context, response) {
    let guild = context.guild;
    let userString = context.args.user;
    let reason = context.args.reason;

    let user = guild.members.find((u) => u.toString() === userString)
    return Rx.Observable.if(
      () => user,
      Rx.Observable.return(user),
      Rx.Observable.fromPromise(context.nix.discord.users.fetch(userString))
    )
      .flatMap((user) => guild.unban(user))
      .flatMap((user) => {
        let modLogEmbed = new Discord.MessageEmbed();
        modLogEmbed
          .setTitle('Unbanned')
          .setThumbnail(user.avatarURL())
          .setColor(Discord.Constants.Colors.DARK_GREEN)
          .addField('To user', user, true)
          .addField('From moderator', context.member, true);

        return addModLogEntry(context, modLogEmbed).map(() => user);
      })
      .flatMap((user) => {
        response.content = `${user.tag} has been unbanned`;
        return response.send();
      })
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          response.type = 'message';

          if (error.message === "Missing Permissions" || error.message === "Privilege is too low...") {
            response.content =
              `Whoops, I do not have permission to ban that user. Either I'm missing the "Ban members" permission, ` +
              `or their permissions outrank mine.`;
            return response.send();
          }

          response.content = `Err... Discord returned an unexpected error when I tried to ban that user.`;
          context.nix.messageOwner(
            "I got this error when I tried to ban a user:",
            {embed: context.nix.createErrorEmbed(context, error)}
          );

          return response.send();
        }

        return Rx.Observable.throw(error);
      });
  },
}
