const { ChaosError } = require("./chaos-errors");

class PermissionLevelError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = "PermissionLevelError";
  }
}

class PermissionLevelNotFound extends PermissionLevelError {
  constructor(message) {
    super(message);
    this.name = "PermissionLevelNotFound";
  }
}

module.exports = {
  PermissionLevelError,
  PermissionLevelNotFound,
};
