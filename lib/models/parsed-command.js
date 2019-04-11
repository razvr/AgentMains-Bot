class ParsedCommand {
  constructor(message, command, args, flags) {
    this.message = message;
    this.command = command;
    this.args = args;
    this.flags = flags;
  }

  run(context, response) {
    return this.command.execCommand(context, response);
  }
}

module.exports = ParsedCommand;
