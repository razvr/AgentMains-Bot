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

  get inputs() {
    this.command.chaos.logger.warn("Context#inputs is deprecated. Please use Context#args");
    return this.args;
  }

  constructor(message, command, args = {}, flags = {}) {
    this.message = message;
    this.command = command;

    this.args = args;
    this.flags = flags;
  }
}

module.exports = CommandContext;
