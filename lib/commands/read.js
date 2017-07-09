const Rx = require('rx');

const DataManager = require('../data-manager');
const Command = require('../command');
const Response = require('../response');

let BoopCommand = new Command({
  name: 'read',
  description: 'Reads a value from the server\'s data',
  adminOnly: true,
  args: [
    {
      name: 'key',
      description: 'The key to write data to',
      required: true,
    },
  ],

  run (context) {
    let dataManager = context.nix.dataManager;

    if (context.channel.type !== 'text') {
      let response = new Response(Response.TYPE_REPLY);
      response.content = 'This command can only be run from a server.';
      return Rx.Observable.just(response);
    }

    let response = new Response(Response.TYPE_MESSAGE);

    return dataManager.getGuildData(context.guild.id)
      .map((savedData) => savedData[context.args.key])
      .map((savedValue) => DataManager.formatForMsg(savedValue))
      .flatMap((stringValue) => {
        response.content = stringValue;
        return Rx.Observable.just(response);
      });
  },
});

module.exports = BoopCommand;
