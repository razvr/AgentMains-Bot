'use strict';
const fs = require('fs');
const Rx = require('rx');
const Discord = require('discord.js');

const NixConfig = require("./index").NixConfig;
const NixLogger = require("./lib/utility/nix-logger");

const ModuleService = require('./lib/services/module-service');
const CommandService = require('./lib/services/command-service');
const DataService = require('./lib/services/data-service');
const ConfigActionService = require('./lib/services/config-action-service');
const PermissionsService = require('./lib/services/permissions-service');
const UserService = require('./lib/services/user-service');

const defaultResponseStrings = require('./lib/utility/reponse-strings');

// noinspection JSUnresolvedFunction
const builtInModules = fs.readdirSync(__dirname + '/lib/modules')
  .map((file) => require(__dirname + '/lib/modules/' + file));

class NixCore {
  /**
   * Create a new instance of Nix
   * @param config {NixConfig} configuration settings for this Nix bot
   */
  constructor(config) {
    if (!(config instanceof NixConfig)) { config = new NixConfig(config); }
    this.config = config;
    this.config.verifyConfig(); // Confirm the config is valid

    this.logger = NixLogger.createLogger(this.config.logger);
    this.responseStrings = Object.assign(defaultResponseStrings, this.config.responseStrings);
    this.services = {};

    this._shutdownSubject = undefined;
    this.shutdown$ = undefined;
    this.main$ = undefined;

    this.streams = {};

    this.discord = new Discord.Client(this.config.discord);
    this._owner = null;

    this.addService('core', DataService);
    this.addService('core', ModuleService);
    this.addService('core', CommandService);
    this.addService('core', ConfigActionService);
    this.addService('core', PermissionsService);
    this.addService('core', UserService);

    builtInModules.forEach((module) => this.addModule(module));
  }

  /**
   * @deprecated
   * @returns {DataService}
   */
  get dataService() {
    this.logger.warn("Deprecation Warning: Accessing dataService directly is deprecated. Please use nix.getService('core', 'dataService') instead.");
    return this.getService('core', 'DataService');
  }

  /**
   * @deprecated
   * @returns {CommandService}
   */
  get commandService() {
    this.logger.warn("Deprecation Warning: Accessing commandService directly is deprecated. Please use nix.getService('core', 'commandService') instead.");
    return this.getService('core', 'CommandService');
  }

  /**
   * @deprecated
   * @returns {ConfigActionService}
   */
  get configActionService() {
    this.logger.warn("Deprecation Warning: Accessing configActionService directly is deprecated. Please use nix.getService('core', 'configActionService') instead.");
    return this.getService('core', 'ConfigActionService');
  }

  /**
   * @deprecated
   * @returns {PermissionsService}
   */
  get permissionsService() {
    this.logger.warn("Deprecation Warning: Accessing permissionsService directly is deprecated. Please use nix.getService('core', 'permissionsService') instead.");
    return this.getService('core', 'PermissionsService');
  }

  /**
   * @deprecated
   * @returns {ModuleService}
   */
  get moduleService() {
    this.logger.warn("Deprecation Warning: Accessing moduleService directly is deprecated. Please use nix.getService('core', 'moduleService') instead.");
    return this.getService('core', 'ModuleService');
  }

  /**
   * @deprecated
   * @returns {UserService}
   */
  get userService() {
    this.logger.warn("Deprecation Warning: Accessing userService directly is deprecated. Please use nix.getService('core', 'userService') instead.");
    return this.getService('core', 'UserService');
  }

  /**
   * Adds a service to Nix for use by modules, commands, and other services.
   *
   * @param moduleName {string} the name of the module that the server is part of
   * @param service {Service} The service to add
   */
  addService(moduleName, service) {
    if (typeof service === "function") {
      this.logger.warn("Deprecation Warning: Passing a Class as the service is deprecated. Please pass an instance of Service");

      let Service = service;
      service = new Service(this);
      service.name = Service.name;
    }

    let serviceKey = `${moduleName}.${service.name}`;

    if (this.services[serviceKey.toLowerCase()]) {
      let error = new Error(`The service ${serviceKey} has already been added.`);
      error.name = "ServiceAlreadyExistsError";
      throw error;
    }

    service._nix = this;

    if (service.onInitalize) {
      this.logger.verbose(`initializing Service: ${serviceKey}`);
      service.onInitalize(this.config);
    }

    this.logger.verbose(`added Service: ${serviceKey}`);
    this.services[serviceKey.toLowerCase()] = service;
  }

  /**
   * Get a Nix service
   *
   * @param moduleName {string} the name of the module the service is from
   * @param serviceName {string} tjhe name of the service
   * @returns {*} the requested service
   */
  getService(moduleName, serviceName) {
    let serviceKey = `${moduleName}.${serviceName}`;
    let service = this.services[serviceKey.toLowerCase()];

    if (!service) {
      let error = new Error(`The service ${serviceKey} could not be found`);
      error.name = "ServiceNotFoundError";
      throw error;
    }

    return service;
  }

  /**
   * alias the addConfigActions function to the Nix object for easier use.
   *
   * @param configActions {Object} The config module to add to Nix
   */
  addConfigActions(configActions) {
    this.getService('core', 'configActionService').addConfigActions(configActions);
  }

  /**
   * alias the addModule function to the Nix object for easier use.
   *
   * @param module {Object} The module to add to Nix
   */
  addModule(module) {
    this.getService('core', 'moduleService').addModule(module);
  }

  /**
   * Start the discord bot
   *
   * @param ready {function} (optional) A callback function for when Nix is ready
   * @param error {function} (optional) A callback function for when an unhandled error occurs
   * @param complete {function} (optional) A callback function for when Nix shuts down
   * @return {Rx.Observable<string>} an observable stream to subscribe to
   */
  listen(ready, error, complete) {
    let dataService = this.getService('core', 'dataService');

    if (!this.listening) {
      //use replay subjects to let future subscribers know that the event has already passed.
      this._shutdownSubject = new Rx.ReplaySubject();
      this._listenSubject = new Rx.ReplaySubject();

      this.shutdown$ = this._shutdownSubject
        .do(() => this.logger.info('Shutdown signal received.'))
        .share();

      this.main$ =
        Rx.Observable
          .return()
          .do(() => this.logger.debug(`Beginning to listen`))
          .flatMap(() => this.discord.login(this.config.loginToken))
          .do(() => this.logger.info(`Logged into Discord. In ${this.discord.guilds.size} guilds`))
          .do(() =>
            this.discord
              .guilds
              .array()
              .forEach((guild) => this.logger.verbose(`In guild '${guild.name}' (${guild.id})`))
          )
          .flatMap(() => this.findOwner())
          .do((owner) => this.logger.info(`Found owner ${owner.tag}`))
          .do(() => this.logger.info(`Preparing DataSource`))
          .flatMap(() => this._readyDataSource())
          .do(() => this.logger.info(`DataSource is ready`))
          .merge(this._startEventStreams())
          .do(() => this.logger.info(`Event streams started`))
          .do(() => this.logger.info(`Starting onNixListen hooks`))
          .flatMap(() => dataService.onNixListen()) // prepare dataService first
          .flatMap(() =>
            Rx.Observable
              .from(Object.values(this.services))
              .filter((service) => service.name !== 'DataService')
              .filter((service) => typeof service.onNixListen !== 'undefined')
              .flatMap((service) => service.onNixListen())
              .defaultIfEmpty(true)
              .last() //wait for all the onNixListens hooks to complete
          )
          .do(() => this.logger.info(`onNixListen hooks complete`))
          .do(() => this.logger.info(`Starting startup onNixJoinGuild hooks`))
          .flatMap(() =>
            Rx.Observable
              .from(this.discord.guilds.array())
              .flatMap((guild) => dataService.onNixJoinGuild(guild).map(guild))
              .flatMap((guild) =>
                Rx.Observable
                  .from(Object.values(this.services))
                  .filter((service) => service.name !== 'DataService')
                  .filter((service) => typeof service.onNixJoinGuild !== 'undefined')
                  .flatMap((service) => service.onNixJoinGuild(guild))
              )
              .defaultIfEmpty(true)
              .last() //wait for all the onNixJoinGuild hooks to complete
          )
          .do(() => this.logger.info(`onNixJoinGuild hooks complete`))
          .flatMap(() => this.messageOwner("I'm now online."))
          .do(() => this.logger.info(`Owner messaged, ready to go!`))
          .share();

      this.main$.subscribe(
        () => this._listenSubject.onNext('Ready'),
        (error) => this._listenSubject.onError(error),
        () =>
          Rx.Observable
            .return()
            .do(() => this.logger.info(`Closing Discord connection`))
            .flatMap(() => this.discord.destroy())
            .subscribe(
              () => this.logger.info(`Discord connection closed`),
              (error) => this._listenSubject.onError(error),
              () => this._listenSubject.onCompleted()
            )
      );
    }

    this._listenSubject.subscribe(ready, error, complete);
    return this._listenSubject;
  }

  /**
   * Checks if Nix is listening to Discord
   * @returns {boolean}
   */
  get listening() {
    return !!this.main$;
  }

  /**
   * Triggers a soft shutdown of the bot.
   */
  shutdown() {
    if (!this.listening) { throw new Error("Bot is not listening."); }
    this._shutdownSubject.onNext(true);
    this._shutdownSubject.onCompleted();
  }

  /**
   * Sends a message to the owner of the bot
   *
   * @param message
   * @param options
   *
   * @return {Rx.Observable<string>} an observable stream to subscribe to
   */
  messageOwner(message, options={}) {
    if (this.owner === null) {
      return Rx.Observable.throw(new Error('Owner was not found.'));
    }

    return Rx.Observable.fromPromise(this.owner.send(message, options));
  }

  /**
   * Returns the owner user, if they were found.
   *
   * @return {null|Discord.User}
   */
  get owner() {
    return this._owner;
  }

  /**
   * Finds the owner of this bot in Discord
   * @returns {Rx.Observable<User>}
   */
  findOwner() {
    return Rx.Observable
      .fromPromise(this.discord.fetchUser(this.config.ownerUserId))
      .do((user) => this._owner = user);
  }

  /**
   * Prepares the database
   * @private
   * @returns {Rx.Observable<any>}
   */
  _readyDataSource() {
    let moduleService = this.getService('core', 'moduleService');

    let guilds = this.discord.guilds;
    if (guilds.size === 0) {
      return Rx.Observable.return();
    }

    return Rx.Observable
      .from(guilds.values())
      .flatMap((guild) => moduleService.prepareDefaultData(this, guild.id))
      .last();
  }

  /**
   * Creates the event processing streams from Discord
   *
   * @private
   */
  _startEventStreams() {
    let moduleService = this.getService('core', 'moduleService');
    let commandService = this.getService('core', 'commandService');

    // Create a stream for all the Discord events
    Object.values(Discord.Constants.Events).forEach((eventType) => {
      let streamName = eventType + '$';
      this.logger.silly(`adding stream nix.streams.${streamName}`);
      this.streams[streamName] =
        Rx.Observable
          .fromEvent(
            this.discord,
            eventType,
            function(...args) {
              if(args.length > 1) { return args; }
              return args[0];
            }
          );
    });

    // Create Nix specific event streams
    this.streams.command$ =
      this.streams.message$
        .filter((message) => message.channel.type === 'text')
        .filter((message) => commandService.msgIsCommand(message));

    // Apply takeUntil and share to all streams
    for(let streamName in this.streams) {
      this.streams[streamName] =
        this.streams[streamName]
          .takeUntil(this.shutdown$)
          .share();
    }

    // Listen to events
    this.streams.command$
      .flatMap((message) => commandService.runCommandForMsg(message) )
      .subscribe(
        () => {},
        (error) => { throw error; }
      );

    this.streams.guildCreate$
      .flatMap((guild) => moduleService.prepareDefaultData(this, guild.id).map(() => guild))
      .flatMap((guild) => commandService.onNixJoinGuild(guild))
      .subscribe(
        () => {},
        (error) => { throw error; }
      );

    return Rx.Observable
      .merge(Object.values(this.streams))
      .ignoreElements()
      .doOnCompleted(() => this.streams = {})
      .share();
  }

  handleError(context, error) {
    this.logger.error(`Error in command:\n${error.stack}`);

    this.messageOwner(
      this.responseStrings.commandRun.unhandledException.forOwner({}),
      {embed: this.createErrorEmbed(context, error)}
    );

    let content = this.responseStrings.commandRun.unhandledException.forUser({owner: context.nix.owner});
    context.message.channel.send(content);

    return Rx.Observable.of();
  }

  createErrorEmbed(context, error) {
    let embed = {
      fields: [
        {
          name: 'Error:',
          value: error.message,
        },
        {
          name: 'User:',
          value: context.author.tag,
        },
        {
          name: 'Message:',
          value: context.message.content,
        },
        {
          name: 'Channel Type:',
          value: context.channel.type,
        },
      ],
    };

    if (context.channel.type === 'text') {
      embed.fields.push({
        name: 'Guild:',
        value: context.channel.guild.name,
      });
      embed.fields.push({
        name: 'Channel:',
        value: context.channel.name,
      });
    }

    let stack = error.stack.split('\n');
    let stackString = '';
    let nextLine = stack.shift();

    while (nextLine && (stackString + '\n' + nextLine).length <= 1008) { // max length of 1008-ish characters
      stackString += '\n' + nextLine;
      nextLine = stack.shift();
    }

    if (stack.length >= 1) {
      stackString += '\n  ...';
    }

    embed.fields.push({
      name: 'Stack:',
      value: stackString,
    });

    return embed;
  }
}

module.exports = NixCore;
