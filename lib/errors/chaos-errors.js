class ChaosError extends Error {
  constructor(message) {
    super();
    this.message = message;
    this.name = "ChaosError";
  }
}

module.exports = {
  ChaosError,
};
