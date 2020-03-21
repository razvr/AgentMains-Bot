const { ChaosError } = require("./chaos-errors");

class RoleNotFoundError extends ChaosError {}

module.exports = {
  RoleNotFoundError,
};
