class ParsedCommand {
  constructor(message, command, args, flags) {
    this.message = message;
    this.command = command;
    this.args = args;
    this.flags = flags;
  }
}

module.exports = ParsedCommand;
