const { ChaosError } = require("./chaos-errors");

class PermissionLevelError extends ChaosError {}

class PermLevelError extends PermissionLevelError {}

class PermissionLevelNotFound extends PermissionLevelError {}

module.exports = {
  PermissionLevelError,
  PermissionLevelNotFound,
  PermLevelError,
};
