module.exports = {
  name: 'help',
  description: 'See all commands that I can do',
  showInHelp: false,

  run (context, response) {
    let commandManager = context.nix.commandManager;

    response.type = 'embed';
    response.content = "Here's everything that I can do. If you want more help on a specific command, add '--help' to the command ";

    Object.values(commandManager.commands)
      .filter((command) => !command.adminOnly)
      .filter((command) => command.showInHelp)
      .forEach((command) => {
        response.embed.addField(commandManager.commandPrefix + command.name,  command.description);
      });

    return response.send();
  },
};
