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
const modules = fs.readdirSync(__dirname + '/lib/modules')
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

    this._dataService = new DataService(this);

    this.services = {
      core: {
        CommandService: new CommandService(this),
        ConfigActionService: new ConfigActionService(this),
        PermissionsService: new PermissionsService(this),
        ModuleService: new ModuleService(this),
        UserService: new UserService(this),
      },
    };

    this._shutdownSubject = undefined;
    this.shutdown$ = undefined;
    this.main$ = undefined;

    this.responseStrings = Object.assign(defaultResponseStrings, this.config.responseStrings);
    this.streams = {};

    this._discord = new Discord.Client(this.config.discord);
    this._owner = null;

    modules.forEach((module) => this.moduleService.addModule(module));
  }

  get dataService() { return this._dataService; }
  get commandService() { return this.getService('core', 'CommandService'); }
  get configActionService() { return this.getService('core', 'ConfigActionService'); }
  get permissionsService() { return this.getService('core', 'PermissionsService'); }
  get moduleService() { return this.getService('core', 'ModuleService'); }
  get userService() { return this.getService('core', 'UserService'); }

  addService(module, Service) {
    this.logger.debug(`adding Service: ${module}.${Service.name}`);
    let moduleServices = this.services[module];
    if (!moduleServices) {
      moduleServices = {};
      this.services[module] = moduleServices;
    }

    moduleServices[Service.name] = new Service(this);
  }

  getService(module, serviceName) {
    let moduleServices = this.services[module];
    if (!moduleServices) { throw new Error('Module has no services'); }
    return moduleServices[serviceName];
  }

  get _allServices() {
    let list = [];
    Object.values(this.services).forEach((moduleServices) => {
      list = list.concat(Object.values(moduleServices));
    });
    return list;
  }

  /**
   * alias the addConfigActions function to the Nix object for easier use.
   *
   * @param configActions {Object} The config module to add to Nix
   */
  addConfigActions(configActions) {
    this.configActionService.addConfigActions(configActions);
  }

  /**
   * alias the addModule function to the Nix object for easier use.
   *
   * @param module {Object} The module to add to Nix
   */
  addModule(module) {
    this.moduleService.addModule(module);
  }

  /**
   * Start the discord bot
   *
   * @return {Rx.Observable} an observable stream to subscribe to
   */
  listen(ready, error, complete) {
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
              .forEach((guild) => this.logger.debug(`In guild '${guild.name}' (${guild.id})`))
          )
          .flatMap(() => this.findOwner())
          .do((owner) => this.logger.info(`Found owner ${owner.tag}`))
          .do(() => this.logger.info(`Preparing DataSource`))
          .flatMap(() => this._readyDataSource())
          .do(() => this.logger.info(`DataSource is ready`))
          .merge(this._startEventStreams())
          .do(() => this.logger.info(`Event streams started`))
          .do(() => this.logger.info(`Starting onNixListen hooks`))
          .flatMap(() => this.dataService.onNixListen())
          .flatMap(() =>
            Rx.Observable
              .from(this._allServices)
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
              .flatMap((guild) => this.dataService.onNixJoinGuild(guild).map(guild))
              .flatMap((guild) =>
                Rx.Observable
                  .from(this._allServices)
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
   * @return {Rx.Observable} an observable stream to subscribe to
   */
  messageOwner(message, options={}) {
    if (this.owner === null) {
      return Rx.Observable.throw(new Error('Owner was not found.'));
    }

    return Rx.Observable.fromPromise(this.owner.send(message, options));
  }

  /**
   * Returns the Discord client instance that the bot is using.
   *
   * @return {Discord.Client}
   */
  get discord() {
    return this._discord;
  }

  /**
   * Returns the owner user, if they were found.
   *
   * @return {null|Discord.User}
   */
  get owner() {
    return this._owner;
  }

  findOwner() {
    return Rx.Observable
      .fromPromise(this._discord.fetchUser(this.config.ownerUserId))
      .do((user) => this._owner = user);
  }

  _readyDataSource() {
    let guilds = this.discord.guilds;
    if (guilds.size === 0) {
      return Rx.Observable.return();
    }

    return Rx.Observable
      .from(guilds.values())
      .flatMap((guild) => this.moduleService.prepareDefaultData(this, guild.id))
      .last();
  }

  /**
   * Creates the event processing streams from Discord
   *
   * @private
   */
  _startEventStreams() {
    // Create a stream for all the Discord events
    Object.values(Discord.Constants.Events).forEach((eventType) => {
      let streamName = eventType + '$';
      this.logger.debug(`adding stream nix.streams.${streamName}`);
      this.streams[streamName] =
        Rx.Observable
          .fromEvent(
            this._discord,
            eventType,
            function(...args) {
              if(args.length > 1) { return args; }
              return args[0];
            }
          );
    });

    // Create Nix specific event streams
    this.streams.command$ =
      this.streams
        .message$
        .filter((message) => message.channel.type === 'text')
        .filter((message) => this.commandService.msgIsCommand(message));

    // Apply takeUntil and share to all streams
    for(let streamName in this.streams) {
      this.streams[streamName] =
        this.streams[streamName]
          .takeUntil(this.shutdown$)
          .share();
    }

    // Listen to events
    this.streams.command$.subscribe(
      (message) =>
        this.commandService
          .runCommandForMsg(message)
          .subscribe()
      );
    this.streams.guildCreate$.subscribe((guild) =>
      this.moduleService
        .prepareDefaultData(this, guild.id)
        .merge([
          this.commandService.onNixJoinGuild(guild),
        ])
        .subscribe()
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

    return Rx.Observable.return();
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
