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
    this.chaos.logger.warn('CommandContext#user is deprecated. Please use #author instead.');
    return this.author;
  }

  get channel() {
    return this.message.channel;
  }

  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  constructor(chaos, message, command, args, flags) {
    this.chaos = chaos;

    this.message = message;
    this.command = command;

    this.args = args;
    this.flags = flags;
  }
}

module.exports = CommandContext;
