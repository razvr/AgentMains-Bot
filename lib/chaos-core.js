const Rx = require('rx');
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
    this.shutdown$ = null;

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
   * @return {Rx.Observable<string>} an observable stream to subscribe to
   */
  listen() {
    if (!this.listening) {
      this._listening = true;

      //use replay subjects to let future subscribers know that ChaosCore has already started listening.
      this._shutdownSubject = new Rx.ReplaySubject();
      this._listenSubject = new Rx.ReplaySubject();

      this.shutdown$ = this._shutdownSubject
        .do(() => this.logger.info('Shutdown signal received.'))
        .share();

      Rx.Observable.of('')
        .flatMap(() => {
          this.logger.verbose(`Logging into Discord`);
          return this.discord.login(this.config.loginToken);
        })
        .flatMap(() => {
          this.logger.verbose(`Logged into Discord. In ${this.discord.guilds.size} guilds`);
          return this.findOwner().do((owner) => this.logger.verbose(`Found owner ${owner.tag}`));
        })
        .flatMap(() => {
          this.logger.verbose(`Initializing data source`);
          return this._initializeDataSource();
        })
        .flatMap(() => {
          this.logger.verbose(`Starting event streams`);
          return this._startEventStreams()
            .do(() => this.logger.verbose(`event streams started`));
        })
        .flatMap(() => this.onListen())
        .flatMap(() => {
          this.logger.verbose(`Starting boot up onJoinGuild hooks`);
          return Rx.Observable.from(this.discord.guilds.array())
            .flatMap((guild) => this.onJoinGuild(guild))
            .defaultIfEmpty('')
            .last()
            .do(() => this.logger.verbose(`onJoinGuild hooks complete`));
        })
        .do(() => {
          let statsString = this._statsString();
          this.logger.info(statsString);
          this.logger.info(`Ready!`);
          this._listenSubject.onNext('Ready');

          if (this.config.messageOwnerOnBoot) {
            this.messageOwner(`I'm now online:\n\`\`\`${statsString}\`\`\``);
          }
        })
        .last()
        .do(() => this.logger.info(`Closing Discord connection`))
        .flatMap(() => this.discord.destroy())
        .subscribe(
          () => {},
          (error) => {
            this.logger.error(error);
            this._listenSubject.onError(error);
            this._listening = false;
          },
          () => {
            this.logger.info(`Shutdown complete`);
            this._listenSubject.onCompleted();
            this._listening = false;
          },
        );
    }

    return this._listenSubject;
  }

  /**
   * Triggers a soft shutdown of the bot.
   */
  shutdown() {
    if (!this.listening) { throw new Error("Bot is not listening."); }

    this._shutdownSubject.onNext(true);
    this._shutdownSubject.onCompleted();

    return this._listenSubject
      .toArray()
      .map(() => true);
  }

  /**
   * Sends a message to the owner of the bot
   *
   * @param message
   * @param options
   *
   * @return {Rx.Observable<string>} an observable stream to subscribe to
   */
  messageOwner(message, options = {}) {
    if (this.owner === null) {
      return Rx.Observable.throw(new Error('Owner was not found.'));
    }

    return Rx.Observable.fromPromise(this.owner.send(message, options));
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

  runHook(hookListener, hookName, args = [], raiseErrors = false) {
    if (!hookListener[hookName]) {
      return Rx.Observable.of(true);
    }

    return Rx.Observable
      .of(hookListener[hookName])
      .flatMap((hook) => toObservable(hook.apply(hookListener, args)))
      .defaultIfEmpty('')
      .last()
      .map(() => true)
      .catch((error) =>
        this
          .handleError(error, [
            { name: "Hook", value: hookName },
            { name: "Listener Type", value: hookListener.constructor.name },
            { name: "Listener Name", value: hookListener.name },
            { name: "Hook Args", value: JSON.stringify(args) },
          ])
          .flatMap(() => {
            if (raiseErrors) {
              return Rx.Observable.throw(error);
            } else {
              return Rx.Observable.of(false);
            }
          }),
      );
  }

  handleError(error, extraFields) {
    this.logger.error(error.stack.toString());
    let embed = this.createEmbedForError(error, extraFields);
    return this.messageOwner(this.responseStrings.commandRun.unhandledException.forOwner({}), { embed });
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

    return Rx.Observable.of('')
      .do(() => this.logger.verbose(`== Starting onListen hooks`))
      .flatMap(() => Rx.Observable.from(hookListeners))
      .filter((hookListener) => hookListener.onListen)
      .concatMap((hookListener) => {
        return toObservable(hookListener.onListen())
          .catch((error) => this.handleError(error, [
            { name: "Hook", value: 'onListen' },
            { name: "Listener", value: hookListener.constructor.name },
          ]).flatMap(() => Rx.Observable.throw(error)));
      })
      .toArray()
      .map(() => true)
      .do(() => this.logger.verbose(`== Completed onListen hooks`));
  }

  onJoinGuild(guild) {
    const hookListeners = [
      this.dataManager,
      this.pluginManager,
      this.servicesManager,
      this.configManager,
      this.commandManager,
    ];

    return Rx.Observable.of('')
      .do(() => this.logger.verbose(`Starting onJoinGuild hooks for guild '${guild.name}' (${guild.id})`))
      .flatMap(() => Rx.Observable.from(hookListeners))
      .filter((hookListener) => hookListener.onJoinGuild)
      .concatMap((hookListener) => {
        return toObservable(hookListener.onJoinGuild(guild))
          .catch((error) => this.handleError(error, [
            { name: "Hook", value: 'onJoinGuild' },
            { name: "Guild ", value: guild.name },
            { name: "Guild Id", value: guild.id },
            { name: "Listener", value: hookListener.constructor.name },
          ]).flatMap(() => Rx.Observable.throw(error)));
      })
      .toArray()
      .map(() => true)
      .do(() => this.logger.verbose(`Completed onJoinGuild hooks for guild ${guild.id} (${guild.name})`));
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
  _startEventStreams() {
    let commandService = this.getService('core', 'commandService');

    // Create a stream for all the Discord events
    Object.values(Discord.Constants.Events).forEach((eventType) => {
      let streamName = eventType + '$';
      this.streams[streamName] =
        Rx.Observable
          .fromEvent(
            this.discord,
            eventType,
            function (...args) {
              if (args.length > 1) {
                return args;
              }
              return args[0];
            },
          );
      this.logger.silly(`Created stream chaos.streams.${streamName}`);
    });

    // Create ChaosCore specific event streams
    this.streams.command$ =
      this.streams.message$
        .filter((message) => message.channel.type === 'text')
        .filter((message) => commandService.msgIsCommand(message));

    // Apply takeUntil and share to all streams
    for (let streamName in this.streams) {
      this.streams[streamName] =
        this.streams[streamName]
          .do((data) => this.logger.silly(`Event ${streamName}: ${data}`))
          .takeUntil(this.shutdown$)
          .share();
    }

    let eventStreams = Rx.Observable
      .merge([
        ...Object.values(this.streams),
        this.streams.guildCreate$.flatMap((guild) => this.onJoinGuild(guild)),
        this.streams.command$.flatMap((message) => commandService.runCommandForMsg(message)),
      ])
      .ignoreElements();

    return Rx.Observable.of('').merge(eventStreams);
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
