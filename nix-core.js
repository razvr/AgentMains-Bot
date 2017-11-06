'use strict';

const fs = require('fs');
const Rx = require('rx');
const Discord = require('discord.js');

const defaultResponseStrings = require('./lib/default-reponse-strings');
const CommandManager = require('./lib/managers/command-manager');
const DataManager = require('./lib/managers/data-manager');

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

    this._message$ = this._createMessageStream();
    this._disconnect$ = this._createDisconnectStream();
    this._command$ = this._createCommandStream(this._message$);

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
    this.listening = true;

    return Rx.Observable.fromPromise(this.discord.login(this._loginToken))
      .flatMap(() => this._findOwner())
      .flatMap(() => Rx.Observable.merge([
        this._message$,
        this._disconnect$,
        this._command$,
        this.messageOwner("I'm now online."),
      ]))
      .takeWhile(() => this.listening)
      .doOnError(() => this.shutdown())
      .ignoreElements();
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

  /**
   * Creates the message processing stream from the Discord 'message' event
   *
   * @private
   *
   * @return {Rx.Observable} Observable stream of messages from Discord
   */
  _createMessageStream() {
    return Rx.Observable.fromEvent(this._discord, 'message');
  }

  /**
   * Creates the message processing stream from the Discord 'disconnect' event. Handles disconnect from Discord and
   * forwards a notification to the owner.
   *
   * @private
   *
   * @return {Rx.Observable} Observable stream of disconnects from Discord
   */
  _createDisconnectStream() {
    return Rx.Observable.fromEvent(this._discord, 'disconnect')
      .do((message) => console.error('Disconnected from Discord with code "' + message.code + '" for reason: ' + message))
      .flatMap((message) => this.messageOwner('I was disconnected. :( \nError code was ' + message.code));
  }

  /**
   * Creates a command processing stream from the given message stream. Filters out non-command messages, and executes
   * the commands.
   *
   * @param message$ {Rx.Observable} Stream of Discord messages that may contain commands
   *
   * @private
   *
   * @return {Rx.Observable} Observable stream of processed commands
   */
  _createCommandStream(message$) {
    return message$
      .filter((message) => this.commandManager.msgIsCommand(message))
      .map((message) => this.commandManager.parse(message, this))
      .flatMap((parsedCommand) => parsedCommand.run())
      .catch((error) => {
        console.error(error);
        this.messageOwner('Unhandled error: ' + error);

        // Restart the stream so that Nix continues to handle commands
        return this._createCommandStream(message$);
      });
  }

  _findOwner() {
    return Rx.Observable.fromPromise(this._discord.fetchUser(this._ownerUserId))
      .do((user) => console.log('owner "' + user.username + '" found.'))
      .do((user) => this._owner = user);
  }
}

module.exports = NixCore;
