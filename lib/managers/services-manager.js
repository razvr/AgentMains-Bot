const { from, EMPTY } = require('rxjs');
const { tap, flatMap, map, toArray } = require('rxjs/operators');

const { toObservable } = require("../utility");

class ServicesManager {
  constructor(chaos) {
    this._chaos = chaos;
    this._services = {};

    //Bind methods for aliasing to ChaosCore
    this.addService = this.addService.bind(this);
    this.getService = this.getService.bind(this);

    this.chaos.on('chaos.listen', () => this.onChaosListen());
    this.chaos.on('guildCreate', (guild) => this.onGuildCreate(guild));
  }

  get chaos() {
    return this._chaos;
  }

  get services() {
    return Object.values(this._services);
  }

  addService(pluginName, Service) {
    let serviceKey = `${pluginName}.${Service.name}`;

    if (this._services[serviceKey.toLowerCase()]) {
      let error = new Error(`The service '${serviceKey}' has already been added.`);
      error.name = "ServiceAlreadyExistsError";
      throw error;
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
      let error = new Error(`The service '${serviceKey}' could not be found`);
      error.name = "ServiceNotFoundError";
      throw error;
    }

    return service;
  }

  onChaosListen() {
    return from(this.services).pipe(
      tap((service) => this.chaos.logger.verbose(`onListen service: ${service.pluginName}/${service.name}`)),
      flatMap((service) => {
        if (service.onListen) {
          return toObservable(service.onListen());
        } else {
          return EMPTY;
        }
      }),
      toArray(),
      map(() => true),
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
      map(() => true),
    );
  }
}

module.exports = ServicesManager;
