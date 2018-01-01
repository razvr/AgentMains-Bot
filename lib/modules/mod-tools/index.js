module.exports = {
  name: 'modTools',
  defaultData: [
    {
      keyword: 'modTools.modLogChannel',
      data: null,
    },
  ],
  configActions: [
    {
      name: 'enableModLog',
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
        if(!channel) {
          response.content = "I was not able to find that channel";
          return response.send();
        }

        return context.nix.data
          .setGuildData(guild.id, 'modTools.modLogChannel', channel.id)
          .flatMap(() => channel.send({ content: 'I will post the moderation log here now.' }))
          .flatMap(() => response.send({ content: `I have enabled the mod log in the channel ${channel}` }));
      },
    },
    {
      name: 'disableModLog',
      run(context, response) {
        let guild = context.guild;

        return context.nix.data
          .setGuildData(guild.id, 'modTools.modLogChannel', null)
          .flatMap(() => response.send({content: "I have disabled the mod log."}));
      },
    },
  ],
  commands: [
    require('./commands/warn.js'),
    require('./commands/ban.js'),
    require('./commands/unban.js'),
  ],
};
