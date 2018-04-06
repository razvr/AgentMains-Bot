class ServicesManager {
  constructor(nix) {
    this._nix = nix;
    this._services = {};

    //Bind methods for aliasing to NixCore
    this.addService = this.addService.bind(this);
    this.getService = this.getService.bind(this);
  }

  get services() {
    return Object.values(this._services);
  }

  addService(moduleName, service) {
    if (typeof service === "function") {
      this._nix.logger.warn("Deprecation Warning: Passing a Class as the service is deprecated. Please pass an instance of Service");

      let Service = service;
      service = new Service(this._nix);
      service.name = Service.name;
    }

    let serviceKey = `${moduleName}.${service.name}`;

    if (this._services[serviceKey.toLowerCase()]) {
      let error = new Error(`The service ${serviceKey} has already been added.`);
      error.name = "ServiceAlreadyExistsError";
      throw error;
    }

    service._nix = this._nix;

    if (service.onInitalize) {
      this._nix.logger.verbose(`initializing Service: ${serviceKey}`);
      service.onInitalize(this._nix.config);
    }

    this._nix.logger.verbose(`added Service: ${serviceKey}`);
    this._services[serviceKey.toLowerCase()] = service;
  }

  getService(moduleName, serviceName) {
    let serviceKey = `${moduleName}.${serviceName}`;
    let service = this._services[serviceKey.toLowerCase()];

    if (!service) {
      let error = new Error(`The service ${serviceKey} could not be found`);
      error.name = "ServiceNotFoundError";
      throw error;
    }

    return service;
  }
}

module.exports = ServicesManager;
