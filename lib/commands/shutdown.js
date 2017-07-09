const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

module.exports = new Command({
  name: 'shutdown',
  description: '',
  adminOnly: true,

  run (context) {
    context.nix.shutdown();

    let response = new Response(Response.TYPE_MESSAGE);
    response.content = "Ok, I'm shutting down now.";

    return Rx.Observable.just(response);
  },
});
