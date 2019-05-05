const CommandParseErrors = require('./command-parse-errors');
const PermissionLevelErrors = require('./permission-level-errors');
const PluginManagerErrors = require('./plugin-manager-errors');

class UserNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

class RoleNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RoleNotFoundError';
  }
}

class InvalidComponentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidComponentError';
  }
}

module.exports = {
  ...CommandParseErrors,
  ...PermissionLevelErrors,
  ...PluginManagerErrors,
  UserNotFoundError,
  RoleNotFoundError,
  InvalidComponentError,
};