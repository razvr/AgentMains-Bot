const { of, from, throwError, ReplaySubject, Subject, fromEvent, EMPTY } = require('rxjs');
const { flatMap, tap, last, toArray, mapTo, catchError, filter } = require('rxjs/operators');
const Discord = require('discord.js');

const ChaosConfig = require("./models/chaos-config");
const ChaosLogger = require("./chaos-logger");
const corePlugin = require("./core-plugin");
const DataManager = require('./managers/data-manager');
const CommandManager = require('./managers/command-manager');
const ServicesManager = require('./managers/services-manager');
const PluginManager = require('./managers/plugin-manager');
const ConfigManager = require('./managers/config-manager');
const PermissionsManager = require('./managers/permissions-manager');
const EventManager = require('./managers/event-manager');
const defaultResponseStrings = require('./response-strings');

const packageJson = require('../package.json');
const { toObservable } = require("./utility");

class ChaosCore {
  /**
   * Create a new instance of ChaosCore
   * @param config {ChaosConfig} configuration settings for this ChaosCore bot
   */
  constructor(config) {
    if (!(config instanceof ChaosConfig)) { config = new ChaosConfig(config); }
    this.config = config;
    this.config.verifyConfig(); // Confirm the config is valid

    this.logger = ChaosLogger.createLogger(this.config.logger);

    this.responseStrings = Object.assign(defaultResponseStrings, this.config.responseStrings);

    this._shutdownSubject = null;
    this._listening = false;

    this.streams = {};

    this.discord = new Discord.Client(this.config.discord);
    this._owner = null;

    this._initializeManagers();
    this._initializeEvents();
    this._loadPlugins();
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
   * Checks if ChaosCore is listening to Discord
   * @returns {boolean}
   */
  get listening() {
    return this._listening;
  }

  _initializeManagers() {
    this.eventManager = new EventManager(this);
    this.addEventListener = this.eventManager.addEventListener;
    this.registerEvent = this.eventManager.registerEvent;
    this.triggerEvent = this.eventManager.triggerEvent;
    this.on = this.addEventListener;
    this.emit = this.triggerEvent;

    this.dataManager = new DataManager(this);
    this.setGuildData = this.dataManager.setGuildData;
    this.getGuildData = this.dataManager.getGuildData;

    this.pluginManager = new PluginManager(this);
    this.addPlugin = this.pluginManager.addPlugin;
    this.getPlugin = this.pluginManager.getPlugin;

    this.commandManager = new CommandManager(this);
    this.addCommand = this.commandManager.addCommand;
    this.getCommand = this.commandManager.getCommand;

    this.servicesManager = new ServicesManager(this);
    this.addService = this.servicesManager.addService;
    this.getService = this.servicesManager.getService;

    this.configManager = new ConfigManager(this);
    this.addConfigAction = this.configManager.addConfigAction;
    this.getConfigAction = this.configManager.getConfigAction;

    this.permissionsManager = new PermissionsManager(this);
    this.addPermissionLevel = this.permissionsManager.addPermissionLevel;
    this.getPermissionLevel = this.permissionsManager.getPermissionLevel;
  }

  _initializeEvents() {
    this.registerEvent('chaos.listen');

    Object.values(Discord.Constants.Events).forEach((event) => {
      this.registerEvent(event);
      fromEvent(
        this.discord,
        event,
        (...args) => args.length > 1 ? args : args[0],
      ).pipe(
        flatMap((payload) => this.emit(event, payload)),
      ).subscribe();

      const streamName = event + '$';
      const streamSubject = new Subject();
      this.on(event, (payload) => streamSubject.next(payload));
      this.streams[streamName] = streamSubject.pipe(
        tap(() => this.logger.warn(
          `chaos.streams.${streamName} is deprecated. Please use chaos.on('${event}', () => {}) instead.`,
        )),
      );
    });
  }

  _loadPlugins() {
    this.addPlugin(corePlugin);
    this.config.plugins.forEach((plugin) => this.addPlugin(plugin));
  }

  /**
   * Start the discord bot
   *
   * @return {Observable<string>} an observable stream to subscribe to
   */
  listen() {
    if (!this.listening) {
      this._listening = true;

      //use replay subjects to let future subscribers know that ChaosCore has already started listening.
      this._listenSubject = new ReplaySubject();
      this._shutdownSubject = new ReplaySubject();
      this.shutdown$ = this._shutdownSubject.pipe();

      this.shutdown$.pipe(
        tap(() => this.logger.info(`Closing Discord connection`)),
        flatMap(() => this.discord.destroy()),
        tap(() => this._listening = false),
        tap(() => this._shutdownSubject.complete()),
      ).subscribe();

      of('').pipe(
        tap(() => this.logger.info(`=== Starting ChaosCore ===`)),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Logging into Discord`)),
          flatMap(() => this.discord.login(this.config.loginToken)),
          tap(() => this.logger.info(`Logged into Discord. In ${this.discord.guilds.size} guilds`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Finding owner`)),
          flatMap(() => this.findOwner()),
          tap(() => this.logger.info(`Found owner ${this._owner.tag}`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Running startup guildCreate event`)),
          flatMap(() => from(this.discord.guilds.array())),
          flatMap((guild) => this.emit('guildCreate', guild)),
          toArray(),
          tap(() => this.logger.info(`Completed startup guildCreate event`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Starting chaos.listen event`)),
          flatMap(() => this.emit('chaos.listen')),
          tap(() => this.logger.info(`Completed chaos.listen event`)),
        )),
        flatMap(() => of(this._statsString()).pipe(
          tap((statsString) => this.logger.info(statsString)),
          flatMap((statsString) => {
            if (this.config.messageOwnerOnBoot) {
              return this.messageOwner(`I'm now online:\n\`\`\`${statsString}\`\`\``);
            } else {
              return of('');
            }
          }),
        )),
        tap(() => {
          this.logger.info(`Ready!`);
          this._listenSubject.next('Ready');
          this._listenSubject.complete();
        }),
        catchError((error) => {
          return this.shutdown().pipe(
            flatMap(() => throwError(error)),
          );
        }),
      ).subscribe();
    }

    return this._listenSubject;
  }

  /**
   * Triggers a soft shutdown of the bot.
   */
  shutdown() {
    if (!this.listening) { throw new Error("Bot is not listening."); }

    this.logger.info('Shutdown signal received.');
    this._shutdownSubject.next(true);

    return this.shutdown$.pipe(
      toArray(),
      mapTo(true),
    );
  }

  /**
   * Sends a message to the owner of the bot
   *
   * @param message
   * @param options
   *
   * @return {Observable<string>} an observable stream to subscribe to
   */
  messageOwner(message, options = {}) {
    if (this.owner === null) {
      return throwError(new Error('Owner was not found.'));
    } else {
      return from(this.owner.send(message, options));
    }
  }

  /**
   * Finds the owner of this bot in Discord
   * @returns {Observable<User>}
   */
  findOwner() {
    return of('').pipe(
      flatMap(() => this.discord.fetchUser(this.config.ownerUserId)),
      tap((user) => this._owner = user),
      mapTo(''),
    );
  }

  /**
   * RxJs operator for handling errors in a stream.
   * Notifies the owner of the error, with the additional fields and then
   * rethrows the error
   *
   * @param embedFields {Array<{name: string, value: string}>}
   *    additional data for the message to the owner
   *
   * @returns {function(source: Observable): Observable}
   */
  notifyError(embedFields) {
    return (source) => source.pipe(
      catchError((error) => of('').pipe(
        flatMap(() => this.handleError(error, embedFields)),
        flatMap(() => throwError(error)),
      )),
    );
  }

  /**
   * RxJs operator for handling errors in a stream.
   * Notifies the owner of the error, with the additional fields and then
   * completes the stream
   *
   * @param embedFields {Array<{name: string, value: string}>}
   *    additional data for the message to the owner
   *
   * @returns {function(source: Observable): Observable}
   */
  catchError(embedFields) {
    return (source) => source.pipe(
      catchError((error) => of('').pipe(
        flatMap(() => this.handleError(error, embedFields)),
        flatMap(() => EMPTY),
      )),
    );
  }

  /**
   * Notifies the owner of the error, with the additional fields
   *
   * @param error {Error} the error that was raised
   * @param embedFields {Array<{name: string, value: string}>}
   *    additional data for the message to the owner
   *
   * @returns {Observable<ObservedValueOf<Observable<string>>>}
   */
  handleError(error, embedFields) {
    this.logger.error(error.stack.toString());

    const embed = this.createEmbedForError(error, embedFields);
    const ownerMsg = this.responseStrings.commandRun.unhandledException.forOwner({});

    return from(this.messageOwner(ownerMsg, { embed }));
  }

  /**
   * Builds a embed for the error with additional fields if needed
   *
   * @param error {Error} The error to build an embed for
   * @param extraFields {Array} List of additional fields to add to the embed
   * @returns {RichEmbed}
   */
  createEmbedForError(error, extraFields = []) {
    let embed = new Discord.RichEmbed();

    embed.addField("Error:", `${error.name}: ${error.message}`);
    extraFields.forEach((field) => {
      embed.addField(field.name, field.value);
    });
    embed.addField('Stack:', this._getStackForEmbed(error));

    return embed;
  }

  _statsString() {
    let dataSource = this.dataManager.type;
    let guilds = this.discord.guilds;
    let plugins = this.pluginManager.plugins;
    let services = this.servicesManager.services;
    let commands = this.commandManager.commands;

    return [
      '=== System Stats: ===',
      `Chaos-Core Version:`,
      `\t${packageJson.version}`,
      `Data source:`,
      `\t${dataSource}`,
      `Guilds: ${guilds.size}`,
      guilds.map((g) => '\t' + g.name).join('\n'),
      `Plugins: ${plugins.length}`,
      plugins.map((m) => '\t' + m.name).join('\n'),
      `Services: ${services.length}`,
      services.map((s) => '\t' + s.name).join('\n'),
      `Commands: ${commands.length}`,
      commands.map((c) => '\t' + c.name).join('\n'),
    ].join('\n');
  }

  _initializeDataSource() {
    return this.dataManager.onListen();
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

module.exports = ChaosCore;
