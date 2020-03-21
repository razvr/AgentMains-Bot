const { ChaosError } = require("./chaos-errors");

class CommandServiceError extends ChaosError {}

class CommandDisabledError extends CommandServiceError {}

class EnableCommandError extends CommandDisabledError {}

class DisableCommandError extends CommandDisabledError {}

class CommandParseError extends ChaosError {}

class InvalidPrefixError extends CommandParseError {
  constructor(message = 'Message does not start with a valid prefix') {
    super(message);
  }
}

class CommandError extends ChaosError {}

class ReqCommandError extends CommandError {}

class CommandAlreadyAdded extends CommandError {}

class CommandNotFoundError extends CommandError {}

module.exports = {
  CommandServiceError,
  CommandDisabledError,
  EnableCommandError,
  DisableCommandError,
  CommandParseError,
  InvalidPrefixError,
  CommandError,
  ReqCommandError,
  CommandAlreadyAdded,
  CommandNotFoundError,
};
