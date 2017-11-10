'use strict';

const fs = require('fs');
const Rx = require('rx');
const Discord = require('discord.js');

const CommandManager = require('./lib/managers/command-manager');
const DataManager = require('./lib/managers/data-manager');

const defaultResponseStrings = require('./lib/built-in/reponse-strings');
const defaultCommandFiles = fs.readdirSync(__dirname + '/lib/built-in/commands')
  .map((file) => require(__dirname + '/lib/built-in/commands/' + file));

class NixCore {
  /**
   * Create a new instance of Nix
   *
   * @param config {Object} The settings for Nix to use
   * @param config.discord {Object} The instance of a Discord.js Client for Nix to use.
   * @param config.loginToken {String} A Discord login token to authenticate with Discord.
   * @param config.ownerUserId {String} The user ID of the owner of the bot.
   * @param config.commands {Array<CommandConfig>}
   * @param config.responseStrings {Object}
   */
  constructor(config) {
    config = Object.assign({
      discord: {},
      commands: [],
      dataSource: {
        type: 'none',
      },
      responseStrings: {},
    }, config);

    config.responseStrings = Object.assign(defaultResponseStrings, config.responseStrings);

    this._discord = new Discord.Client(config.discord);
    this._loginToken = config.loginToken;
    this._ownerUserId = config.ownerUserId;
    this._owner = null;

    this._createStreams();

    this.listening = false;

    this._commandManager = new CommandManager(config.commands);
    this._dataManager = new DataManager(config.dataSource);

    this._responseStrings = config.responseStrings;

    // Load default commands
    defaultCommandFiles.forEach((command) => {
      this.addCommand(command);
    });
  }

  get commandManager() {
    return this._commandManager;
  }

  get dataManager() {
    return this._dataManager;
  }

  get responseStrings() {
    return this._responseStrings;
  }

  /**
   * alias the addCommand function to the Nix object for easier use.
   *
   * @param command {CommandConfig} The command to add to Nix
   */
  addCommand(command) {
    this.commandManager.addCommand(command);
  }

  /**
   * Start the discord bot
   *
   * @return {Rx.Observable} an observable stream to subscribe to
   */
  listen() {
    if (!this.mainStream$) {
      this.listening = true;

      this.mainStream$ = Rx.Observable
        .return()
        .flatMap(() => this.discord.login(this._loginToken))
        .flatMap(() => this._findOwner())
        .flatMap(() => {
          let eventStream$ = Rx.Observable.merge(Object.values(this._streams));
          this.messageOwner("I'm now online.");
          return eventStream$;
        })
        .takeWhile(() => this.listening)
        .doOnError(() => this.shutdown())
        .ignoreElements()
        .share();
    }

    return this.mainStream$;
  }

  /**
   * Triggers a soft shutdown of the bot.
   */
  shutdown() {
    console.log('No longer listening');
    this.listening = false;
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
    if (this.owner !== null) {
      return Rx.Observable.fromPromise(this.owner.send(message, options));
    } else {
      return Rx.Observable.throw('Owner was not found.');
    }
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

  _findOwner() {
    return Rx.Observable.fromPromise(this._discord.fetchUser(this._ownerUserId))
      .do((user) => this._owner = user);
  }

  /**
   * Creates the message processing stream from the Discord 'message' event
   *
   * @private
   *
   * @return {Rx.Observable} Observable stream of messages from Discord
   */
  _createStreams() {
    this._streams = {};

    this._streams.guildCreate$ =
      Rx.Observable
        .fromEvent(this._discord, 'guildCreate')
        .share();

    this._streams.disconnect$ =
      Rx.Observable
        .fromEvent(this._discord, 'disconnect')
        .do((message) => console.error('[WARN] Disconnected from Discord with code "' + message.code + '" for reason: ' + message))
        .flatMap((message) => this.messageOwner('I was disconnected. :( \nError code was ' + message.code))
        .share();

    this._streams.message$ =
      Rx.Observable
        .fromEvent(this._discord, 'message')
        .share();

    this._streams.command$ =
      this._streams.message$
        .filter((message) => this.commandManager.msgIsCommand(message))
        .map((message) => this.commandManager.parse(message, this))
        .flatMap((parsedCommand) => parsedCommand.run())
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
      title: this.name,
      description: this.description,

      fields: [
        {
          name: 'Error:',
          value: error.message,
        },
        {
          name: 'User:',
          value: context.user.tag,
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
    else if (context.channel.type === 'group') {
      embed.fields.push({
        name: 'Recipients:',
        value: users.map((user) => user.tag).join(', '),
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
