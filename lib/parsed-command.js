const Rx = require('rx');

const Response = require('./response');

class ParsedCommand {
  constructor (command, context) {
    this._command = command;
    this._context = context;
  }

  run () {
    if (this._command.adminOnly) {
      if (this._context.message.author.id !== this._context.nix.owner.id) {
        let response = new Response(Response.TYPE_NONE);
        return response.respondTo(this._context.message);
      }
    }

    return this._command
      .run(this._context)
      .flatMap((response) => response.respondTo(this._context.message));
  }
}

module.exports = ParsedCommand;
