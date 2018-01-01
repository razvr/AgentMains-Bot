module.exports = {
  name: 'enableModLog',
  description: 'Report bans, warnings, and unbannings to a channel',
  inputs: [
    {
      name: 'channel',
      description: 'the channel to set the mod log to',
      required: true,
    },
  ],
  run(context, response) {
    let guild = context.guild;
    let channelString = context.args.input1;

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      response.content = "I was not able to find that channel";
      return response.send();
    }

    return context.nix.data
      .setGuildData(guild.id, 'modTools.modLogChannel', channel.id)
      .flatMap(() => channel.send({content: 'I will post the moderation log here now.'}))
      .flatMap(() => response.send({content: `I have enabled the mod log in the channel ${channel}`}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Access") {
            return response.send({content: `Whoops, I do not have permission to talk in that channel.`});
          }

          response.content = `Err... Discord returned an unexpected error when I tried to talk in that channel.`;
          context.nix.messageOwner(
            "I got this error when I tried to post the mod log in a channel",
            {embed: context.nix.createErrorEmbed(context, error)}
          );

          return response.send();
        }

        return Rx.Observable.throw(error);
      });
  },
};
