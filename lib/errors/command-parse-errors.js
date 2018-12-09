class CommandParseError extends Error{
  constructor(props) {
    super(props);
    this.name = "CommandParseError";
  }
}

class InvalidPrefixError extends CommandParseError {
  constructor() {
    super('Message does not start with a valid prefix');
    this.name = "InvalidPrefixError";
  }
}

module.exports = {
  CommandParseError,
  InvalidPrefixError,
};
