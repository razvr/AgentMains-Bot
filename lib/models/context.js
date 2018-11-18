class Context {
  get message() {
    return this.parsedCommand.message;
  }

  get command() {
    return this.parsedCommand.command;
  }

  get args() {
    return this.parsedCommand.args;
  }

  get flags() {
    return this.parsedCommand.flags;
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
    return this.member || this.author;
  }

  get channel() {
    return this.message.channel;
  }

  constructor(parsedCommand, nix) {
    this.parsedCommand = parsedCommand;
    this.nix = nix;
  }
}

module.exports = Context;
