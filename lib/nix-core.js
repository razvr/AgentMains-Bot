const Rx = require('rx');
const Discord = require('discord.js');

const NixConfig = require("./models/nix-config");
const NixLogger = require("./utility/nix-logger");

const DataManager = require('./managers/data-manager');
const CommandManager = require('./managers/command-manager');
const ServicesManager = require('./managers/services-manager');
const ModuleManager = require('./managers/module-manager');
const ConfigManager = require('./managers/config-manager');
const PermissionsManager = require('./managers/permissions-manager');

const defaultResponseStrings = require('./utility/reponse-strings');

const packageJson = require('../package.json');

class NixCore {
  /**
   * Checks if Nix is listening to Discord
   * @returns {boolean}
   */
  get listening() {
    return this.main$ !== null;
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

    this.dataManager = new DataManager(this);
    this.setGuildData = this.dataManager.setGuildData;
    this.getGuildData = this.dataManager.getGuildData;

    this.commandManager = new CommandManager(this);
    this.addCommand = this.commandManager.addCommand;
    this.getCommand = this.commandManager.getCommand;

    this.servicesManager = new ServicesManager(this);
    this.addService = this.servicesManager.addService;
    this.getService = this.servicesManager.getService;

    this.moduleManager = new ModuleManager(this);
    this.addModule = this.moduleManager.addModule;
    this.getModule = this.moduleManager.getModule;

    this.configManager = new ConfigManager(this);
    this.addConfigAction = this.configManager.addConfigAction;
    this.getConfigAction = this.configManager.getConfigAction;

    this.permissionsManager = new PermissionsManager(this);
    this.addPermissionLevel = this.permissionsManager.addPermissionLevel;
    this.getPermissionLevel = this.permissionsManager.getPermissionLevel;

    this.servicesManager.loadServices();
    this.moduleManager.loadModules();
    this.commandManager.loadCommands();
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
          .flatMap(() => {
            this.logger.verbose(`Configuring Services`);
            return this.servicesManager.configureServices();
          })
          .flatMap(() => {
            this.logger.verbose(`Configuring Commands`);
            return this.commandManager.configureCommands();
          })
          .flatMap(() => {
            this.logger.verbose(`Configuring Config Actions`);
            return this.configManager.configureActions();
          })
          .flatMap(() => {
            this.logger.verbose(`Logging into Discord`);
            return this.discord.login(this.config.loginToken);
          })
          .flatMap(() => {
            this.logger.verbose(`Logged into Discord. In ${this.discord.guilds.size} guilds`);
            return this.findOwner().do((owner) => this.logger.verbose(`Found owner ${owner.tag}`));
          })
          .flatMap(() => {
            this.logger.verbose(`Initalizeing data source`);
            return this._initalizeDataSource();
          })
          .flatMap(() => {
            this.logger.verbose(`Starting event streams`);
            return this._startEventStreams()
              .do(() => this.logger.verbose(`event streams started`));
          })
          .flatMap(() => {
            this.logger.verbose(`Starting onNixListen hooks`);
            return this.onNixListen()
              .do(() => this.logger.verbose(`onNixListen hooks complete`));
          })
          .flatMap(() => {
            this.logger.verbose(`Starting boot up onNixJoinGuild hooks`);
            return Rx.Observable.from(this.discord.guilds.array())
              .flatMap((guild) => this.onNixJoinGuild(guild))
              .defaultIfEmpty('')
              .last()
              .map(() => true)
              .do(() => this.logger.verbose(`boot up onNixJoinGuild hooks complete`));
          })
          .do(() => {
            let statsString = this._statsString();
            this.logger.info(statsString);
            if (this.config.messageOwnerOnBoot) {
              this.messageOwner(`I'm now online:\n\`\`\`${statsString}\`\`\``);
            }
          })
          .share();

      this.main$.subscribe(
        () => {
          this.logger.info(`Ready!`);
          this._listenSubject.onNext('Ready');
        },
        (error) => {
          this.logger.error(error);
          this._listenSubject.onError(error);
        },
        () =>
          Rx.Observable
            .return()
            .do(() => this.logger.info(`Closing Discord connection`))
            .flatMap(() => this.discord.destroy())
            .subscribe(
              () => this.logger.info(`Discord connection closed`),
              (error) => this._listenSubject.onError(error),
              () => {
                this._listenSubject.onCompleted();
                this.main$ = null;
              }
            )
      );
    }

    this._listenSubject.subscribe(ready, error, complete);
    return this._listenSubject;
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

  handleHook(hookReturnValue) {
    if (typeof hookReturnValue === 'undefined') {
      return Rx.Observable.of('');
    }

    if (hookReturnValue instanceof Rx.Observable) {
      return hookReturnValue;
    }

    if (typeof hookReturnValue.then === 'function') {
      return Rx.Observable.fromPromise(hookReturnValue);
    }

    return Rx.Observable.of(hookReturnValue);
  }

  runHook(hookListener, hookName, args = [], raiseErrors = false) {
    if (!hookListener[hookName]) {
      return Rx.Observable.of(true);
    }

    return Rx.Observable
      .of(hookListener[hookName])
      .map((hook) => hook.apply(hookListener, args))
      .flatMap((returnValue) => this.handleHook(returnValue))
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
            }
            else {
              return Rx.Observable.of(false);
            }
          })
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

  onNixListen() {
    return Rx.Observable.of('')
      .do(() => this.logger.debug(`Starting onNixListen hooks`))
      .flatMap(() => this.runHook(this.servicesManager, 'onNixListen', [], true))
      .flatMap(() => this.runHook(this.moduleManager, 'onNixListen', [], true))
      .defaultIfEmpty('')
      .last()
      .map(() => true)
      .do(() => this.logger.debug(`Completed onNixListen hooks`));
  }

  onNixJoinGuild(guild) {
    return Rx.Observable.of('')
      .do(() => this.logger.debug(`Starting onNixJoinGuild hooks for guild '${guild.name}' (${guild.id})`))
      .flatMap(() => this.runHook(this.dataManager, 'onNixJoinGuild', [guild], true))
      .flatMap(() => this._readyDataSource(guild))
      .flatMap(() => this.runHook(this.servicesManager, 'onNixJoinGuild', [guild], true))
      .flatMap(() => this.runHook(this.moduleManager, 'onNixJoinGuild', [guild], true))
      .defaultIfEmpty('')
      .last()
      .map(() => true)
      .do(() => this.logger.debug(`Completed onNixJoinGuild hooks for guild ${guild.id} (${guild.name})`));
  }

  _statsString() {
    let dataSource = this.dataManager.type;
    let guilds = this.discord.guilds;
    let modules = this.moduleManager.modules;
    let services = this.servicesManager.services;
    let commands = this.commandManager.commands;

    return [
      '=== System Stats: ===',
      `Nix-Core Version:`,
      `\t${packageJson.version}`,
      `Data source:`,
      `\t${dataSource}`,
      `Guilds: ${guilds.size}`,
      guilds.map((g) => '\t' + g.name).join('\n'),
      `Modules: ${modules.length}`,
      modules.map((m) => '\t' + m.name).join('\n'),
      `Services: ${services.length}`,
      services.map((s) => '\t' + s.name).join('\n'),
      `Commands: ${commands.length}`,
      commands.map((c) => '\t' + c.name).join('\n'),
    ].join('\n');
  }

  /**
   * Prepares the database
   * @private
   * @returns {Rx.Observable<any>}
   */
  _readyDataSource(guild) {
    let moduleService = this.getService('core', 'moduleService');

    this.logger.debug(`Preparing default data for guild ${guild.id}`);
    return moduleService.prepareDefaultData(this, guild.id);
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
            }
          );
      this.logger.debug(`Created stream nix.streams.${streamName}`);
    });

    // Create Nix specific event streams
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
        this.streams.guildCreate$.flatMap((guild) => this.onNixJoinGuild(guild)),
        this.streams.command$.flatMap((message) => commandService.runCommandForMsg(message)),
      ])
      .ignoreElements();

    return Rx.Observable.of('').merge(eventStreams);
  }

  _initalizeDataSource() {
    return Rx.Observable.of('')
      .flatMap(() => this.dataManager.onNixListen())
      .flatMap(() =>
        Rx.Observable
          .from(this.discord.guilds.values())
          .flatMap((guild) => this._readyDataSource(guild))
          .defaultIfEmpty('')
          .last()
      );
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
