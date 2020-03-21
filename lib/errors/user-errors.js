const { ChaosError } = require("./chaos-errors");

class UserNotFoundError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

class AmbiguousUserError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = 'AmbiguousUserError';
  }
}

module.exports = {
  UserNotFoundError,
  AmbiguousUserError,
};
