const CommandParseErrors = require('./command-parse-errors');
const PermissionLevelErrors = require('./permission-level-errors');

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

module.exports = {
  ...CommandParseErrors,
  ...PermissionLevelErrors,
  UserNotFoundError,
  RoleNotFoundError,
};