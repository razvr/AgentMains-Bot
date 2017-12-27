module.exports = {
  name: 'setPrefix',
  run: (context, response) => {
    let dataManager = context.nix.dataManager;
    let newPrefix = context.args.input1;

    return dataManager
      .setGuildData(context.guild.id, 'core.commandPrefix', newPrefix)
      .flatMap(() => {
        response.type = 'message';
        response.content = `${newPrefix} is now the command prefix`;
        return response.send();
      });
  },
};
