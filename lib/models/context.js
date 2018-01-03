class Context {
  get dataService() {
    return this.nix.dataService;
  }

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
    if (this.member) {
      return this.member.user;
    }
    else if (this.author) {
      return this.author;
    }
    else {
      return null;
    }
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
