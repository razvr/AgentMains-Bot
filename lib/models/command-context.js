class CommandContext {
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
    this.nix.logger.warn('CommandContext#user is deprecated. Please use #author instead.');
    return this.author;
  }

  get channel() {
    return this.message.channel;
  }

  constructor(nix, message, command, args, flags) {
    this.nix = nix;

    this.message = message;
    this.command = command;

    this.args = args;
    this.flags = flags;
  }
}

module.exports = CommandContext;
