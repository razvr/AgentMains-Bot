const Rx = require('rx');

const services = require('../services');
const { toObservable } = require("../utility");

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
    Object.values(services).forEach((Service) => {
      this.addService('core', Service);
    });

    Object.entries(this.nix.config.services).forEach(([pluginName, services]) => {
      services.forEach((service) => this.addService(pluginName, service));
    });
  }

  addService(pluginName, Service) {
    let serviceKey = `${pluginName}.${Service.name}`;

    if (this._services[serviceKey.toLowerCase()]) {
      let error = new Error(`The service '${serviceKey}' has already been added.`);
      error.name = "ServiceAlreadyExistsError";
      throw error;
    }

    let service = new Service(this._nix);

    this._nix.logger.verbose(`Loaded Service: ${serviceKey}`);
    this._services[serviceKey.toLowerCase()] = service;
  }

  getService(pluginName, serviceName) {
    let serviceKey = `${pluginName}.${serviceName}`;
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
      .do((service) => this.nix.logger.debug(`Configure service: ${service.name}`))
      .filter((service) => service.configureService)
      .flatMap((service) => toObservable(service.configureService()))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }

  onNixListen() {
    return Rx.Observable.from(this.services)
      .filter((service) => service.onNixListen)
      .flatMap((service) => toObservable(service.onNixListen()))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }

  onNixJoinGuild(guild) {
    return Rx.Observable.from(this.services)
      .filter((service) => service.onNixJoinGuild)
      .flatMap((service) => toObservable(service.onNixJoinGuild(guild)))
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }
}

module.exports = ServicesManager;
