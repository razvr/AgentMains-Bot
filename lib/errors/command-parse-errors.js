class CommandParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "CommandParseError";
  }
}

class InvalidPrefixError extends CommandParseError {
  constructor(message = 'Message does not start with a valid prefix') {
    super(message);
    this.name = "InvalidPrefixError";
  }
}

module.exports = {
  CommandParseError,
  InvalidPrefixError,
};
