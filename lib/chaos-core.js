const { of, from, throwError, ReplaySubject, Subject, fromEvent, EMPTY } = require('rxjs');
const { flatMap, tap, toArray, mapTo, catchError } = require('rxjs/operators');
const Discord = require('discord.js');
const deepmerge = require("deepmerge");

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
const { ChaosError } = require('./errors');
const defaultStrings = require('./strings');

const packageJson = require('../package.json');

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
    this.strings = { ...defaultStrings };

    this._shutdownSubject = null;
    this._listening = false;

    this.discord = new Discord.Client(this.config.discord);
    this._owner = null;

    this._initializeManagers();
    this._initializeEvents();
    this._loadPlugins();

    this.applyStrings(this.config.strings);
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

  applyStrings(strings) {
    this.strings = deepmerge(this.strings, strings || {});
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
    this.registerEvent('chaos.ready');

    Object.values(Discord.Constants.Events).forEach((event) => {
      this.registerEvent(event);
      fromEvent(
        this.discord,
        event,
        (...args) => args.length > 1 ? args : args[0],
      ).pipe(
        flatMap((payload) => this.emit(event, payload)),
      ).subscribe();

      const streamSubject = new Subject();
      this.on(event, (payload) => streamSubject.next(payload));
    });

    this.on('chaos.ready', () => {
      const statsString = this._statsString();
      this.logger.info(`Ready!`);
      this.logger.info(statsString);
      if (this.config.messageOwnerOnBoot) {
        this.messageOwner(`I'm now online:\n\`\`\`${statsString}\`\`\``);
      }
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
        flatMap(() => of('').pipe(
          tap(() => this.logger.info(`=== Starting ChaosCore ===`)),
          flatMap(() => this.emit('chaos.startup')),
          tap(() => this.logger.verbose(`Completed chaos.listen event`)),
        )),
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
          tap(() => this.logger.verbose(`Starting chaos.listen event`)),
          flatMap(() => this.emit('chaos.listen')),
          tap(() => this.logger.verbose(`Completed chaos.listen event`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Running startup guildCreate events`)),
          flatMap(() => from(this.discord.guilds.array())),
          flatMap((guild) => this.emit('guildCreate', guild)),
          toArray(),
          tap(() => this.logger.verbose(`Completed startup guildCreate events`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.info(`=== Ready ===`)),
          flatMap(() => this.emit('chaos.ready')),
        )),
        catchError((error) => this.shutdown().pipe(
          flatMap(() => throwError(error)),
        )),
      ).subscribe(
        () => this._listenSubject.next('Ready'),
        (error) => this._listenSubject.error(error),
        () => this._listenSubject.complete(),
      );
    }

    return this._listenSubject;
  }

  /**
   * Triggers a soft shutdown of the bot.
   */
  shutdown() {
    if (!this.listening) { throw new ChaosError("Bot is not listening."); }

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
      return throwError(new ChaosError('Owner was not found.'));
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
   * @returns {Observable<string>}
   */
  handleError(error, embedFields) {
    this.logger.error(error.stack.toString());

    const embed = this.createEmbedForError(error, embedFields);
    const ownerMsg = this.strings.commandRun.unhandledException.forOwner({});

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

    return [
      '=== System Stats: ===',
      `Chaos-Core Version: ${packageJson.version}`,
      `Data source: ${dataSource}`,
      `Guilds: ${guilds.size}`,
      `Plugins: ${plugins.length}`,
      plugins.map((m) => '\t' + m.name).join('\n'),
    ].join('\n');
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
