const Rx = require('rx');

const DataManager = require('../data-manager');
const Command = require('../command');
const Response = require('../response');

let BoopCommand = new Command({
  name: 'write',
  description: 'Writes a value to the server\'s data',
  adminOnly: true,
  showInHelp: false,
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
    let dataManager = context.nix.dataManager;

    if (context.channel.type !== 'text') {
      let response = new Response(Response.TYPE_REPLY);
      response.content = 'This command can only be run from a server.';
      return Rx.Observable.just(response);
    }

    let dataToSave;

    try {
      dataToSave = JSON.parse(context.args.value);
    } catch (e) {
      if (e instanceof SyntaxError) {
        dataToSave = context.args.value;
      } else {
        throw e;
      }
    }

    let newData = {};
    newData[context.args.key] = dataToSave;

    let response = new Response(Response.TYPE_MESSAGE);

    return dataManager.setGuildData(context.guild.id, newData)
      .flatMap((data) => {
        let value = DataManager.formatForMsg(data[context.args.key]);
        response.content = "Saved to " + context.args.key + ":\n" + value;
        return Rx.Observable.just(response);
      });
  },
});

module.exports = BoopCommand;
