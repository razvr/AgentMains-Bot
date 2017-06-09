const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

module.exports = new Command({
  name: 'shutdown',
  description: '',
  adminOnly: true,

  run (context) {
    if (context.message.author.id === context.nix.owner.id) {
      context.nix.shutdown();

      let response = new Response(Response.TYPE_MESSAGE);
      response.content = "Ok, I'm shutting down now.";

      return Rx.Observable.just(response);
    }
    else {
      let response = new Response(Response.TYPE_MESSAGE);

      response.content = "I can't let you do that.";

      return Rx.Observable.just(response);
    }
  },
});
