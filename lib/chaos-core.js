const { of, from, throwError, ReplaySubject, fromEvent, EMPTY } = require('rxjs');
const { flatMap, tap, last, toArray, mapTo, catchError, filter, takeUntil, map } = require('rxjs/operators');

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

    this.handleHook = (hookReturnValue) => {
      this.logger.trace("chaos#handleHook is deprecated. Please import and use ChaosCore.utility.toObservable");
      return toObservable(hookReturnValue);
    };

    this._initializeManagers();
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

  _loadPlugins() {
    this.addPlugin(corePlugin);

    this.config.plugins.forEach((plugin) => this.addPlugin(plugin));
    this.config.commands.forEach((command) => this.addCommand(command));

    Object.entries(this.config.services).forEach(([pluginName, services]) => {
      services.forEach((service) => this.addService(pluginName, service));
    });
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
          tap(() => this.logger.verbose(`Preparing event streams`)),
          map(() => this._createEventStreams()),
          tap(() => this.logger.verbose(`Created ${Object.values(this.streams).length} even streams`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Logging into Discord`)),
          flatMap(() => this.discord.login(this.config.loginToken)),
          tap(() => this.logger.verbose(`Logged into Discord. In ${this.discord.guilds.size} guilds`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Finding owner`)),
          flatMap(() => this.findOwner()),
          tap(() => this.logger.verbose(`Found owner ${this._owner.tag}`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Initializing data source`)),
          flatMap(() => this._initializeDataSource()),
          tap(() => this.logger.verbose(`Data source ready`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Starting boot up onJoinGuild hooks`)),
          flatMap(() => from(this.discord.guilds.array())),
          flatMap((guild) => this.onJoinGuild(guild)),
          last(null, ''),
          tap(() => this.logger.verbose(`onJoinGuild hooks complete`)),
        )),
        flatMap(() => of('').pipe(
          tap(() => this.logger.verbose(`Starting onListen hooks`)),
          flatMap(() => this.onListen()),
          tap(() => this.logger.verbose(`Completed onListen hooks`)),
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

  catchError(embedFields) {
    return (source) => {
      return source.pipe(
        catchError((error) => {
          return this.notifyError(error, embedFields).pipe(
            catchError(() => EMPTY),
          );
        }),
      );
    };
  }

  notifyError(embedFields) {
    return (source) => {
      return source.pipe(
        catchError((error) => {
          return this.handleError(error, embedFields).pipe(
            flatMap(() => throwError(error)),
          );
        }),
      );
    };
  }

  handleError(error, extraFields) {
    this.logger.error(error.stack.toString());

    const embed = this.createEmbedForError(error, extraFields);
    const ownerMsg = this.responseStrings.commandRun.unhandledException.forOwner({});

    return from(this.messageOwner(ownerMsg, { embed }));
  }

  /**
   * Builds a embed for the error with additional fields if needed
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

  onListen() {
    const hookListeners = [
      this.dataManager,
      this.pluginManager,
      this.servicesManager,
      this.configManager,
      this.commandManager,
    ];

    return of('').pipe(
      flatMap(() => from(hookListeners).pipe(
        filter((hookListener) => hookListener.onListen),
        flatMap((hookListener) => toObservable(hookListener.onListen()).pipe(
          this.notifyError([
            { name: "Hook", value: 'onListen' },
            { name: "Listener", value: hookListener.constructor.name },
          ]),
        )),
        last(null, ''),
      )),
      mapTo(true),
    );
  }

  onJoinGuild(guild) {
    const hookListeners = [
      this.dataManager,
      this.pluginManager,
      this.servicesManager,
      this.configManager,
      this.commandManager,
    ];

    return of('').pipe(
      tap(() => this.logger.verbose(`Starting onJoinGuild hooks for guild '${guild.name}' (${guild.id})`)),
      flatMap(() => from(hookListeners).pipe(
        filter((hookListener) => hookListener.onJoinGuild),
        flatMap((hookListener) => toObservable(hookListener.onJoinGuild(guild)).pipe(
          this.catchError([
            { name: "Hook", value: 'onJoinGuild' },
            { name: "Guild ", value: guild.name },
            { name: "Guild Id", value: guild.id },
            { name: "Listener", value: hookListener.constructor.name },
          ]),
        )),
        last(null, ''),
      )),
      mapTo(true),
      tap(() => this.logger.verbose(`Completed onJoinGuild hooks for guild ${guild.id} (${guild.name})`)),
    );
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

  /**
   * Creates the event processing streams from Discord
   *
   * @private
   */
  _createEventStreams() {
    // Create a stream for all the Discord events
    Object.values(Discord.Constants.Events).forEach((eventType) => {
      let streamName = eventType + '$';

      this.streams[streamName] = fromEvent(
        this.discord,
        eventType,
        (...args) => args.length > 1 ? args : args[0],
      ).pipe(
        takeUntil(this.shutdown$),
        tap((data) => this.logger.silly(`Event ${streamName}: ${data}`)),
      );

      this.logger.silly(`Created stream chaos.streams.${streamName}`);
    });

    this.streams.guildCreate$.pipe(
      flatMap((guild) => this.onJoinGuild(guild)),
    ).subscribe();
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
