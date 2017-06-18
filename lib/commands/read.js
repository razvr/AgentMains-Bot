const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

let BoopCommand = new Command({
  name: 'read',
  description: 'TEST reads data',
  adminOnly: true,
  args: [
    {
      name: 'key',
      description: 'The key to write data to',
      required: true,
    },
  ],

  run (context) {
    if (context.channel.type !== 'text') {
      let response = new Response(Response.TYPE_REPLY);
      response.content = 'This command can only be run from a server.';
      return Rx.Observable.just(response);
    }

    let response = new Response(Response.TYPE_MESSAGE);

    return context.nix.getGuildData(context.guild.id)
      .flatMap((data) => {
        let value = data[context.args.key];

        if(typeof value !== "undefined") {
          response.content = JSON.stringify(value, null, '  ');
        } else {
          response.content = "undefined";
        }

        return Rx.Observable.just(response);
      });
  },
});

module.exports = BoopCommand;
