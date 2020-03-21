const { ChaosError } = require("./chaos-errors");

class RoleNotFoundError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = 'RoleNotFoundError';
  }
}

module.exports = {
  RoleNotFoundError,
};
