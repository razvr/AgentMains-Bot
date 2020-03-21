const { ChaosError } = require("./chaos-errors");

class PermissionLevelError extends ChaosError {}

class PermissionLevelNotFound extends PermissionLevelError {}

module.exports = {
  PermissionLevelError,
  PermissionLevelNotFound,
};
