const CommandParseErrors = require('./command-parse-errors');
const PermissionLevelErrors = require('./permission-level-errors');
const PluginManagerErrors = require('./plugin-manager-errors');
const ChaosErrors = require("./chaos-errors");

class UserNotFoundError extends ChaosErrors.ChaosError {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

class AmbiguousUserError extends ChaosErrors.ChaosError {
  constructor(message) {
    super(message);
    this.name = 'AmbiguousUserError';
  }
}

class RoleNotFoundError extends ChaosErrors.ChaosError {
  constructor(message) {
    super(message);
    this.name = 'RoleNotFoundError';
  }
}

class InvalidComponentError extends ChaosErrors.ChaosError {
  constructor(message) {
    super(message);
    this.name = 'InvalidComponentError';
  }
}

class CommandServiceError extends ChaosErrors.ChaosError {
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
  ...ChaosErrors,
  ...CommandParseErrors,
  ...PermissionLevelErrors,
  ...PluginManagerErrors,
  AmbiguousUserError,
  CommandDisabledError,
  CommandServiceError,
  DisableCommandError,
  EnableCommandError,
  InvalidComponentError,
  RoleNotFoundError,
  UserNotFoundError,
};
