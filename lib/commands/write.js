const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

let BoopCommand = new Command({
  name: 'write',
  description: 'TEST writes data',
  adminOnly: true,
  args: [
    {
      name: 'key',
      description: 'The key to write data to',
      required: true,
    },
    {
      name: 'value',
      description: 'The value to write',
      required: true,
    },
  ],

  run (context) {
    if (context.channel.type !== 'text') {
      let response = new Response(Response.TYPE_REPLY);
      response.content = 'This command can only be run from a server.';
      return Rx.Observable.just(response);
    }

    let newData = {};
    newData[context.args.key] = context.args.value;

    let response = new Response(Response.TYPE_MESSAGE);

    return context.nix.setGuildData(context.guild.id, newData)
      .flatMap((data) => {
        response.content = data[context.args.key] + ' was saved';
        return Rx.Observable.just(response);
      });
  },
});

module.exports = BoopCommand;
