const { from, EMPTY } = require('rxjs');
const { tap, flatMap, toArray, filter } = require('rxjs/operators');

const ChaosManager = require('../models/chaos-manager');
const { ServiceNotFoundError, ServiceAlreadyExistsError } = require("../errors");
const { toObservable } = require("../utility");

class ServicesManager extends ChaosManager {
  constructor(chaos) {
    super(chaos);
    this._services = {};

    //Bind methods for aliasing to ChaosCore
    this.addService = this.addService.bind(this);
    this.getService = this.getService.bind(this);

    this.chaos.on('chaos.listen', () => this.onChaosListen());
    this.chaos.on('guildCreate', (guild) => this.onGuildCreate(guild));
  }

  get services() {
    return Object.values(this._services);
  }

  addService(pluginName, Service) {
    let serviceKey = `${pluginName}.${Service.name}`;

    if (this._services[serviceKey.toLowerCase()]) {
      throw new ServiceAlreadyExistsError(`The service '${serviceKey}' has already been added.`);
    }

    let service = new Service(this.chaos);
    service.pluginName = pluginName;

    this.chaos.logger.verbose(`Loaded Service: ${serviceKey}`);
    this._services[serviceKey.toLowerCase()] = service;
  }

  getService(pluginName, serviceName) {
    let serviceKey = `${pluginName}.${serviceName}`;
    let service = this._services[serviceKey.toLowerCase()];

    if (!service) {
      throw new ServiceNotFoundError(`The service '${serviceKey}' could not be found`);
    }

    return service;
  }

  onChaosListen() {
    return from(this.services).pipe(
      filter((service) => service.onListen),
      tap((service) => this.logger.warn(
        `${service.name}.onListen is deprecated. ` +
        `Please use chaos.on("chaos.listen", () => {}) instead'`,
      )),
      flatMap((service) => toObservable(service.onListen())),
      toArray(),
    );
  }

  onGuildCreate(guild) {
    return from(this.services).pipe(
      flatMap((service) => {
        if (service.onJoinGuild) {
          this.chaos.logger.warn('.onJoinGuild is deprecated. Please use chaos.on("guildCreate", () => {}) instead');
          return toObservable(service.onJoinGuild(guild));
        } else {
          return EMPTY;
        }
      }),
      toArray(),
    );
  }
}

module.exports = ServicesManager;
