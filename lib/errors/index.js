const CommandParseErrors = require('./command-parse-errors');
const PermissionLevelErrors = require('./permission-level-errors');
const PluginManagerErrors = require('./plugin-manager-errors');

class ChaosError extends Error {
  constructor(message) {
    super();
    this.message = message;
    this.name = "ChaosError";
  }
}

class UserNotFoundError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

class RoleNotFoundError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = 'RoleNotFoundError';
  }
}

class InvalidComponentError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = 'InvalidComponentError';
  }
}

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

module.exports = {
  ...CommandParseErrors,
  ...PermissionLevelErrors,
  ...PluginManagerErrors,
  UserNotFoundError,
  RoleNotFoundError,
  InvalidComponentError,
  CommandServiceError,
  CommandDisabledError,
  EnableCommandError,
  DisableCommandError,
};