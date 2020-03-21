const { ChaosError } = require("./chaos-errors");

class CommandServiceError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = 'CommandServiceError';
  }
}

class CommandDisabledError extends CommandServiceError {
  constructor(message) {
    super(message);
    this.name = 'CommandDisabledError';
  }
}

class EnableCommandError extends CommandDisabledError {
  constructor(message) {
    super(message);
    this.name = 'EnableCommandError';
  }
}

class DisableCommandError extends CommandDisabledError {
  constructor(message) {
    super(message);
    this.name = 'DisableCommandError';
  }
}

class CommandParseError extends ChaosError {
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
  CommandServiceError,
  CommandDisabledError,
  EnableCommandError,
  DisableCommandError,
  CommandParseError,
  InvalidPrefixError,
};
