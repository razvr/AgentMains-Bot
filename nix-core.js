'use strict';
const fs = require('fs');
const Rx = require('rx');
const Discord = require('discord.js');
const Winston = require('winston');

const LogService = require('./lib/services/log-service');
const ModuleService = require('./lib/services/module-service');
const CommandService = require('./lib/services/command-service');
const DataService = require('./lib/services/data-service');
const ConfigService = require('./lib/services/config-service');
const PermissionsService = require('./lib/services/permissions-service');

const defaultResponseStrings = require('./lib/utility/reponse-strings');
const defaultModuleFiles = fs.readdirSync(__dirname + '/lib/modules')
  .map((file) => require(__dirname + '/lib/modules/' + file));

class NixCore {
  /**
   * Create a new instance of Nix
   *
   * @param config {Object} The settings for Nix to use
   * @param config.discord {Object} The instance of a Discord.js Client for Nix to use.
   * @param config.loginToken {String} A Discord login token to authenticate with Discord.
   * @param config.ownerUserId {String} The user ID of the owner of the bot.
   * @param config.commands {Array}
   * @param config.dataSource {Object} Configuration settings for the data source
   * @param config.responseStrings {Object}
   */
  constructor(config) {
    config = Object.assign({
      discord: {},
      commands: [],
      dataSource: { type: 'memory' },
      logger: {
        level: 'info',
        format: Winston.format.combine(
          Winston.format.colorize(),
          Winston.format.align(),
          Winston.format.printf(info => `${info.level}: ${info.message}`)
        ),
        transports: [
          new Winston.transports.Console(),
        ],
      },
      responseStrings: {},
    }, config);

    this._logService = new LogService(this, config.logger);

    this._shutdownSubject = undefined;
    this.shutdown$ = undefined;
    this.main$ = undefined;

    this.responseStrings = Object.assign(defaultResponseStrings, config.responseStrings);
    this.streams = {};

    this._discord = new Discord.Client(config.discord);
    this._loginToken = config.loginToken;
    this._ownerUserId = config.ownerUserId;
    this._owner = null;

    this._dataService = new DataService(this, config.dataSource);

    this._commandService = new CommandService(this, config.commands);
    this._configService = new ConfigService(this);
    this._permissionsService = new PermissionsService(this);
    this._moduleService = new ModuleService(this, defaultModuleFiles);
  }

  get logger() { return this._logService.logger; }
  get commandService() { return this._commandService; }
  get dataService() { return this._dataService; }
  get configService() { return this._configService; }
  get permissionsService() { return this._permissionsService; }
  get moduleService() { return this._moduleService; }

  /**
   * alias the addCommand function to the Nix object for easier use.
   *
   * @param command {Object} The command to add to Nix
   */
  addCommand(command) {
    this.commandService.addCommand(command);
  }

  /**
   * alias the addConfigActions function to the Nix object for easier use.
   *
   * @param configActions {Object} The config module to add to Nix
   */
  addConfigActions(configActions) {
    this.configService.addConfigActions(configActions);
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
      this._shutdownSubject = new Rx.Subject();
      this._listenSubject = new Rx.Subject();

      this.shutdown$ = this._shutdownSubject
        .do(() => console.log("{INFO}", 'Shutdown signal received.'))
        .share();

      this.main$ =
        Rx.Observable
          .return()
          .flatMap(() => this.discord.login(this._loginToken))
          .do(() => console.log("{INFO}", 'Logged into Discord'))
          .do(() => console.log("{INFO}", 'In', this.discord.guilds.size, 'guilds'))
          .flatMap(() => this.findOwner())
          .do((owner) => console.log("{INFO}", "Found owner", owner.tag))
          .do(() => console.log("{INFO}", "Preparing DataSource"))
          .flatMap(() => this._readyDataSource())
          .do(() => console.log("{INFO}", "DataSource is ready"))
          .merge(this._startEventStreams())
          .do(() => console.log("{INFO}", "Event streams started"))
          .flatMap(() =>
            Rx.Observable.merge([
              this.commandService.onNixListen(),
            ])
            .last() //wait for all the onNixListens to complete
            .do(() => console.log("{INFO}", "onNixListen hooks complete"))
          )
          .flatMap(() => this.messageOwner("I'm now online."))
          .do(() => console.log("{INFO}", "Owner messaged, ready to go!"))
          .share();

      this.main$.subscribe(
        () => this._listenSubject.onNext('Ready'),
        (error) => this._listenSubject.onError(error),
        () =>
          Rx.Observable
            .return()
            .do(() => console.log("{INFO}", 'Closing Discord connection'))
            .flatMap(() => this.discord.destroy())
            .subscribe(
              () => console.log("{INFO}", "Discord connection closed"),
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
      .fromPromise(this._discord.users.fetch(this._ownerUserId))
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
      this.streams[eventType + '$'] = Rx.Observable.fromEvent(this._discord, eventType);
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
    console.error(error);

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
