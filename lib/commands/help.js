const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

module.exports = new Command({
  name: 'help',
  description: 'See all commands that I can do',

  run: (context) => {
    let response = new Response(Response.TYPE_EMBED);

    response.content = "here's everything that I can do: ";
    Object.values(context.nix.commands)
      .filter((command) => !command.adminOnly)
      .forEach((command) => {
        response.embed.addField('!' + command.name,  command.description);
      });

    return Rx.Observable.just(response);
  }
});
