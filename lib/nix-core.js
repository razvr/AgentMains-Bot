const fs = require('fs');
const Rx = require('rx');
const Discord = require('discord.js');

const NixConfig = require("./models/nix-config");
const NixLogger = require("./utility/nix-logger");
const ServicesManager = require('./managers/services-manager');
const ModuleManager = require('./managers/module-manager');

const ModuleService = require('./services/module-service');
const CommandService = require('./services/command-service');
const DataService = require('./services/data-service');
const ConfigActionService = require('./services/config-action-service');
const PermissionsService = require('./services/permissions-service');
const UserService = require('./services/user-service');

const defaultResponseStrings = require('./utility/reponse-strings');

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

    this._shutdownSubject = null;
    this.shutdown$ = null;
    this.main$ = null;

    this.streams = {};

    this.discord = new Discord.Client(this.config.discord);
    this._owner = null;

    this.servicesManager = new ServicesManager(this);
    this.addService = this.servicesManager.addService;
    this.getService = this.servicesManager.getService;

    this.moduleManager = new ModuleManager(this);
    this.addModule = this.moduleManager.addModule;
    this.getModule = this.moduleManager.getModule;

    // Bootstrapping complete, load the core services and modules
    this._loadCoreServices();
    this._loadConfigServices();

    this.moduleManager.loadServices();
    this._loadCoreModules();
    this._loadConfigModules();
  }

  /**
   * Loads the core services provided by Nix
   * @private
   */
  _loadCoreServices() {
    this.addService('core', DataService);
    this.addService('core', ModuleService);
    this.addService('core', CommandService);
    this.addService('core', ConfigActionService);
    this.addService('core', PermissionsService);
    this.addService('core', UserService);
  }

  /**
   * Loads all services that have been added via the config file
   * @private
   */
  _loadConfigServices() {
    Object.entries(this.config.services).forEach(([moduleName, services]) => {
      services.forEach((service) => this.addService(moduleName, service));
    });
  }

  /**
   * Loads all core modules provided by Nix
   * @private
   */
  _loadCoreModules() {
    fs.readdirSync(__dirname + '/modules')
      .map((file) => require(__dirname + '/modules/' + file))
      .map((module) => this.addModule(module));
  }

  /**
   * Loads all modules that have been added via the config file
   * @private
   */
  _loadConfigModules() {
    this.config.modules.forEach((module) => this.addModule(module));
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
   * alias the addConfigActions function to the Nix object for easier use.
   *
   * @param configActions {Object} The config module to add to Nix
   */
  addConfigActions(configActions) {
    this.getService('core', 'configActionService').addConfigActions(configActions);
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
    if (!this.listening) {
      //use replay subjects to let future subscribers know that Nix has already started listening.
      this._shutdownSubject = new Rx.ReplaySubject();
      this._listenSubject = new Rx.ReplaySubject();

      this.shutdown$ = this._shutdownSubject
        .do(() => this.logger.info('Shutdown signal received.'))
        .share();

      this.main$ =
        Rx.Observable.of('')
          .do(() => this.logger.info(`Beginning to listen`))
          .do(() => this._logStats())
          .do(() => this.logger.info(`Configuring Services`))
          .flatMap(() => this.servicesManager.configureServices())
          .do(() => this.logger.info(`Logging into Discord`))
          .flatMap(() => this.discord.login(this.config.loginToken))
          .do(() => this.logger.info(`Logged into Discord. In ${this.discord.guilds.size} guilds`))
          .flatMap(() => this.findOwner())
          .do((owner) => this.logger.info(`Found owner ${owner.tag}`))
          .flatMap(() => this._readyDataSource())
          .flatMap(() => this._startEventStreams())
          .flatMap(() => this._doOnNixListenHooks())
          .flatMap(() =>
            Rx.Observable.from(this.discord.guilds.array())
              .flatMap((guild) => this._doOnNixJoinGuildHooks(guild))
              .last()
          )
          .do(() => {
            if (this.config.messageOwnerOnBoot) {
              this.messageOwner("I'm now online.");
            }
          })
          .share();

      this.main$.subscribe(
        () => {
          this.logger.info(`Ready!`);
          this._listenSubject.onNext('Ready');
        },
        (error) => {
          this._listenSubject.onError(error);
          throw error;
        },
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

  _logStats() {
    let commandService = this.getService('core', 'commandService')

    let services = this.servicesManager.services;
    let modules = this.moduleManager.modules;
    let commands = Object.values(commandService.commands);

    this.logger.info(`${services.length} Services loaded`);
    this.logger.info(`${modules.length} Modules loaded`);
    this.logger.info(`${commands.length} Commands loaded`);
  }

  _doOnNixListenHooks() {
    let dataService = this.getService('core', 'dataService');

    return Rx.Observable.of('')
      .do(() => this.logger.info(`Starting onNixListen hooks`))
      .flatMap(() => this._triggerHook(dataService, 'onNixListen')) // prepare dataService first
      .flatMap(() =>
        Rx.Observable.concat(
          Rx.Observable.from(this.servicesManager.services)
            .filter((service) => service.name !== 'DataService'),
          Rx.Observable.from(this.moduleManager.modules)
        )
        .concatMap((hookListener) =>
          this._triggerHook(hookListener, 'onNixListen')
            .catch((error) =>
              this.handleError(error, [
                {name: "Hook", value: 'onNixListen'},
                {name: "Listener Type", value: hookListener.constructor.name},
                {name: "Listener Name", value: hookListener.name},
              ]).map(() => false)
            )
        )
      )
      .toArray() //wait for all the onNixListen hooks to complete
      .do(() => this.logger.info(`onNixListen hooks complete`));
  }

  _doOnNixJoinGuildHooks(guild) {
    let dataService = this.getService('core', 'dataService');

    this.logger.info(`Starting onNixJoinGuild hooks for guild '${guild.name}' (${guild.id})`);
    return Rx.Observable.of('')
      .flatMap(() => this._triggerHook(dataService, 'onNixJoinGuild', [guild]))
      .flatMap(() =>
        Rx.Observable.concat(
          Rx.Observable.from(this.servicesManager.services)
            .filter((service) => service.name !== 'DataService'),
          Rx.Observable.from(this.moduleManager.modules)
        )
        .concatMap((hookListener) =>
          this._triggerHook(hookListener, 'onNixJoinGuild', [guild])
            .catch((error) =>
              this.handleError(error, [
                {name: "Hook", value: 'onNixJoinGuild'},
                {name: "Guild", value: `${guild.name} (${guild.id})`},
                {name: "Listener Type", value: hookListener.constructor.name},
                {name: "Listener Name", value: hookListener.name},
              ]).map(() => false)
            )
        )
      )
      .toArray() //wait for all the onNixJoinGuild hooks to complete
      .do(() => this.logger.info(`Completed onNixJoinGuild hooks for guild ${guild.id} (${guild.name})`));
  }

  _triggerHook(hookListener, hookName, args=[]) {
    if (!hookListener[hookName]) {
      return Rx.Observable.of(true);
    }

    return Rx.Observable
      .of(hookListener[hookName])
      .map((hook) => hook.apply(hookListener, args))
      .flatMap((returnValue) => {
        if (typeof returnValue === 'undefined') {
          return Rx.Observable.of(true);
        }
        else if (returnValue instanceof Rx.Observable) {
          return returnValue;
        }
        else if (typeof returnValue.then === 'function') {
          return Rx.Observable.fromPromise(returnValue);
        }
        else {
          return Rx.Observable.of(true);
        }
      });
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
    this.logger.info(`Preparing DataSource`);

    let moduleService = this.getService('core', 'moduleService');

    let guilds = this.discord.guilds;
    if (guilds.size === 0) {
      return Rx.Observable.return();
    }

    return Rx.Observable
      .from(guilds.values())
      .flatMap((guild) => moduleService.prepareDefaultData(this, guild.id))
      .toArray()
      .do(() => this.logger.info(`DataSource is ready`));
  }

  /**
   * Creates the event processing streams from Discord
   *
   * @private
   */
  _startEventStreams() {
    this.logger.info(`Starting event streams`);

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
      .flatMap((guild) => this._doOnNixJoinGuildHooks(guild))
      .subscribe(
        () => {},
        (error) => { throw error; }
      );

    let eventStreams$ =
      Rx.Observable.merge(Object.values(this.streams))
        .ignoreElements()
        .doOnCompleted(() => this.streams = {});

    return Rx.Observable.of('')
      .merge(eventStreams$)
      .do(() => this.logger.info(`Event streams started`));
  }

  handleError(error, extraFields) {
    this.logger.error(`Error in command:\n${error.stack}`);
    let embed = this._createEmbedForError(error,  extraFields);
    return this.messageOwner(this.responseStrings.commandRun.unhandledException.forOwner({}), { embed });
  }

  /**
   * Builds a embed for the error with additional fields if needed
   * @param error {Error} The error to build an embed for
   * @param extraFields {Array} List of additional fields to add to the embed
   * @returns {RichEmbed}
   * @private
   */
  _createEmbedForError(error, extraFields=[]) {
    let embed = new Discord.RichEmbed();

    embed.addField("Error:", `${error.name}: ${error.message}`);
    extraFields.forEach((field) => {
      embed.addField(field.name, field.value);
    });
    embed.addField('Stack:', this._getStackForEmbed(error));

    return embed;
  }

  _getStackForEmbed(error) {
    let stack = error.stack.split('\n');
    let stackString = '';
    let nextLine = stack.shift();

    while (nextLine && (`${stackString}\n${nextLine}\n...`).length < 1000) { // max length of 1000-ish characters
      stackString += '\n' + nextLine;
      nextLine = stack.shift();
    }

    if (stack.length >= 1) {
      stackString += '\n...';
    }

    return stackString;
  }
}

module.exports = NixCore;
