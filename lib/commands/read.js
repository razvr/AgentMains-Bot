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
      .map((savedData) => savedData[context.args.key])
      .map((savedValue) => {
        switch (typeof savedValue) {
          case "undefined": return "[undefined]";
          case "object":    return JSON.stringify(savedValue, null, '  ');
          default:          return savedValue.toString();
        }
      })
      .flatMap((stringValue) => {
        response.content = stringValue;
        return Rx.Observable.just(response);
      });
  },
});

module.exports = BoopCommand;
