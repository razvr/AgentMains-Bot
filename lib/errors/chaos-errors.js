class ChaosError extends Error {
  constructor(message) {
    super();
    this.message = message;
    this.name = "ChaosError";
  }
}

class InvalidComponentError extends ChaosError {
  constructor(message) {
    super(message);
    this.name = 'InvalidComponentError';
  }
}

module.exports = {
  ChaosError,
  InvalidComponentError,
};
