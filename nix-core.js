'use strict';
const fs = require('fs');
const Rx = require('rx');
const Discord = require('discord.js');

const NixConfig = require("./index").NixConfig;
const NixLogger = require("./lib/utility/nix-logger");
const ServicesManager = require('./lib/utility/services-manager');

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

    this._shutdownSubject = null;
    this.shutdown$ = null;
    this.main$ = null;

    this.streams = {};

    this.discord = new Discord.Client(this.config.discord);
    this._owner = null;

    this.servicesManager = new ServicesManager(this);
    this.addService = this.servicesManager.addService;
    this.getService = this.servicesManager.getService;

    // Bootstrapping complete, load the core services and modules
    this._loadCoreServices();
    this._loadCoreModules();
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
   * Loads all core modules provided by Nix
   * @private
   */
  _loadCoreModules() {
    fs.readdirSync(__dirname + '/lib/modules')
      .map((file) => require(__dirname + '/lib/modules/' + file))
      .map((module) => this.addModule(module));
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
          .flatMap(() => this.findOwner())
          .do((owner) => this.logger.info(`Found owner ${owner.tag}`))
          .flatMap(() => this._readyDataSource())
          .flatMap(() => this._startEventStreams())
          .flatMap(() => this._doOnNixListenHooks())
          .flatMap(() => this._doOnNixJoinGuildHooks())
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

  _doOnNixListenHooks() {
    let dataService = this.getService('core', 'dataService');

    return Rx.Observable.of('')
      .do(() => this.logger.info(`Starting onNixListen hooks`))
      .flatMap(() => this._triggerHook(dataService, 'onNixListen')) // prepare dataService first
      .flatMap(() =>
        Rx.Observable.concat(
          Rx.Observable.from(this.servicesManager.services)
            .filter((service) => service.name !== 'DataService')
        )
      )
      .flatMap((hookListener) => this._triggerHook(hookListener, 'onNixListen'))
      .last() //wait for all the onNixListens hooks to complete
      .do(() => this.logger.info(`onNixListen hooks complete`));
  }

  _doOnNixJoinGuildHooks() {
    let dataService = this.getService('core', 'dataService');

    this.logger.info(`Starting onNixJoinGuild hooks`);
    return Rx.Observable.from(this.discord.guilds.array())
      .flatMap((guild) => this._triggerHook(dataService, 'onNixJoinGuild', [guild]).map(() => guild)) // prepare dataService first
      .flatMap((guild) =>
        Rx.Observable.concat(
          Rx.Observable.from(this.servicesManager.services)
            .filter((service) => service.name !== 'DataService')
        )
        .flatMap((hookListener) => this._triggerHook(hookListener, 'onNixJoinGuild', [guild]))
      )
      .last() //wait for all the onNixJoinGuilds hooks to complete
      .do(() => this.logger.info(`onNixJoinGuild hooks complete`));
  }

  _triggerHook(hookListener, hookName, args) {
    if (!hookListener[hookName]) {
      return Rx.Observable.of(true);
    }

    let returnValue = hookListener[hookName].apply(hookListener, args);

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
      .last()
      .do(() => this.logger.info(`DataSource is ready`));
  }

  /**
   * Creates the event processing streams from Discord
   *
   * @private
   */
  _startEventStreams() {
    this.logger.info(`Starting event streams`);

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

    let eventStreams$ =
      Rx.Observable.merge(Object.values(this.streams))
        .ignoreElements()
        .doOnCompleted(() => this.streams = {})

    return Rx.Observable.of('')
      .merge(eventStreams$)
      .do(() => this.logger.info(`Event streams started`));
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
