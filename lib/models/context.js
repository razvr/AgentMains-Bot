class Context {
  get guild() {
    return this.message.guild;
  }

  get author() {
    return this.message.author;
  }

  get member() {
    return this.message.member;
  }

  get user() {
    return this.member || this.author;
  }

  get channel() {
    return this.message.channel;
  }

  constructor(message, nix, command, params) {
    this.message = message;
    this.nix = nix;
    this.command = command;
    this.args = params.args;
    this.flags = params.flags;
  }
}

module.exports = Context;
