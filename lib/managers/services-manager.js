const Rx = require('rx');

const ModuleService = require('../services/module-service');
const CommandService = require('../services/command-service');
const PermissionsService = require('../services/permissions-service');
const UserService = require('../services/user-service');

class ServicesManager {
  constructor(nix) {
    this._nix = nix;
    this._services = {};

    //Bind methods for aliasing to NixCore
    this.addService = this.addService.bind(this);
    this.getService = this.getService.bind(this);
  }

  get nix() {
    return this._nix;
  }

  get services() {
    return Object.values(this._services);
  }

  /**
   * Loads the core services provided by Nix
   */
  loadServices() {
    this.addService('core', ModuleService);
    this.addService('core', CommandService);
    this.addService('core', PermissionsService);
    this.addService('core', UserService);

    Object.entries(this.nix.config.services).forEach(([moduleName, services]) => {
      services.forEach((service) => this.addService(moduleName, service));
    });
  }

  addService(moduleName, Service) {
    let serviceKey = `${moduleName}.${Service.name}`;

    if (this._services[serviceKey.toLowerCase()]) {
      let error = new Error(`The service '${serviceKey}' has already been added.`);
      error.name = "ServiceAlreadyExistsError";
      throw error;
    }

    let service = new Service(this._nix);

    this._nix.logger.verbose(`Loaded Service: ${serviceKey}`);
    this._services[serviceKey.toLowerCase()] = service;
  }

  getService(moduleName, serviceName) {
    let serviceKey = `${moduleName}.${serviceName}`;
    let service = this._services[serviceKey.toLowerCase()];

    if (!service) {
      let error = new Error(`The service '${serviceKey}' could not be found`);
      error.name = "ServiceNotFoundError";
      throw error;
    }

    return service;
  }

  configureServices() {
    return Rx.Observable.from(this.services)
      .filter((service) => service.configureService)
      .map((service) => service.configureService())
      .flatMap((cmdExit) => this.nix.handleHook(cmdExit))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }

  onNixListen() {
    return Rx.Observable.from(this.services)
      .filter((service) => service.onNixListen)
      .map((service) => service.onNixListen())
      .flatMap((returnValue) => this.nix.handleHook(returnValue))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }

  onNixJoinGuild(guild) {
    return Rx.Observable.from(this.services)
      .filter((service) => service.onNixJoinGuild)
      .map((service) => service.onNixJoinGuild(guild))
      .flatMap((returnValue) => this.nix.handleHook(returnValue))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }
}

module.exports = ServicesManager;
