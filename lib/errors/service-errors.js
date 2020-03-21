const { ChaosError } = require('./chaos-errors');

class ServiceError extends ChaosError {}

class ServiceAlreadyExistsError extends ServiceError {}

class ServiceNotFoundError extends ServiceError {}

module.exports = {
  ServiceError,
  ServiceAlreadyExistsError,
  ServiceNotFoundError,
};
