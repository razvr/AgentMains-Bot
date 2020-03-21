const { ChaosError } = require("./chaos-errors");

class ConfigActionError extends ChaosError {}

class ConfigActionAlreadyExistsError extends ConfigActionError {}

class ConfigActionNotFoundError extends ConfigActionError {}

module.exports = {
  ConfigActionError,
  ConfigActionAlreadyExistsError,
  ConfigActionNotFoundError,
};
