module.exports = {
  name: 'disableModLog',
  description: 'disable the mod log',
  inputs: [],

  run(context, response) {
    let guild = context.guild;

    return context.nix.dataService
      .setGuildData(guild.id, 'modTools.modLogChannel', null)
      .flatMap(() => response.send({content: "I have disabled the mod log."}));
  },
};
