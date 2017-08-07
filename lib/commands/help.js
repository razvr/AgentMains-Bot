const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

module.exports = new Command({
  name: 'help',
  description: 'See all commands that I can do',
  showInHelp: false,

  run (context) {
    let response = new Response(Response.TYPE_EMBED);

    response.content = "Here's everything that I can do. If you want more help on a specific command, add '--help' to the command ";
    Object.values(context.nix.commandReader.commands)
      .filter((command) => !command.adminOnly)
      .filter((command) => command.showInHelp)
      .forEach((command) => {
        response.embed.addField('!' + command.name,  command.description);
      });

    return Rx.Observable.just(response);
  },
});
