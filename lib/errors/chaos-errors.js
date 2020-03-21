class ChaosError extends Error {
  constructor(message = "") {
    super();
    this.message = message;
    this.name = this.constructor.name;
  }
}

class InvalidComponentError extends ChaosError {}

module.exports = {
  ChaosError,
  InvalidComponentError,
};
