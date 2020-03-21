const { ChaosError } = require("./chaos-errors");

class UserNotFoundError extends ChaosError {}

class AmbiguousUserError extends ChaosError {}

module.exports = {
  UserNotFoundError,
  AmbiguousUserError,
};
