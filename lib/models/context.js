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

  get channel() {
    return this.message.channel;
  }

  constructor(message, nix, params) {
    this.message = message;
    this.nix = nix;
    this.args = params.args;
    this.flags = params.flags;
  }
}

module.exports = Context;
