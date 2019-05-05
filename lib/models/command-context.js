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

  get channel() {
    return this.message.channel;
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
