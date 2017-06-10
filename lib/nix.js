'use strict';

const Rx = require('rx');

const CommandContext = require('./command-context');

class Nix {
  /**
   * Create a new instance of Nix
   *
   * @param discordClient {Client} the Discord client to use
   * @param config {Object} The settings for Nix to use
   */
  constructor(discordClient, config) {
    this._discord = discordClient;

    this._loginToken = config.loginToken;
    this._ownerUserId = config.ownerUserId;
    this._owner = null;
    this._games = config.games;

    this._message$ = this._createMessageStream();
    this._disconnect$ = this._createDisconnectStream();
    this._command$ = this._createCommandStream(this._message$);
    this._newGame$ = this._createNewGameStream();

    this.listening = false;
    this.commands = {};
  }

  addCommand(command) {
    console.log("adding command", command.name);
    this.commands[command.name] = command;
  }

  listen() {
    this.listening = true;

    return Rx.Observable.fromPromise(this.discord.login(this._loginToken))
      .flatMap(() => this._findOwner())
      .flatMap(() => {
          return Rx.Observable.merge([
              this._message$,
              this._disconnect$,
              this._command$,
              this._newGame$,
              this.messageOwner("I'm now online."),
          ]);
        }
      )
      .takeWhile(() => this.listening)
      .doOnError(() => this.shutdown())
      .ignoreElements();
  }

  shutdown() {
    console.log('No longer listening');
    this.listening = false;
  }

  messageOwner(message) {
    if(this.owner !== null) {
      return Rx.Observable.fromPromise(this.owner.send(message));
    } else {
      return Rx.Observable.throw('Owner was not found.');
    }
  }

  get discord() {
    return this._discord;
  }

  get owner() {
    return this._owner;
  }

  get games() {
    return this._games;
  }

  getRandomGame() {
    return this.games[Math.floor(Math.random() * this.games.length)];
  }

  _createMessageStream() {
    return Rx.Observable.fromEvent(this._discord, 'message');
  }

  _createDisconnectStream() {
    return Rx.Observable.fromEvent(this._discord, 'disconnect')
      .do((message) => console.error('Disconnected from Discord with code "' + message.code + '" for reason: ' + message))
      .flatMap((message) => this.messageOwner('I was disconnected. :( \nError code was ' + message.code));
  }

  _createCommandStream(message$) {
    return message$
      .filter((message) => this._isCommand(message))
      .flatMap((message) => this._runCommand(message))
      .catch((error) => {
        console.error(error);
        this.messageOwner('Unhandled error: ' + error);

        // Restart the stream so that Nix continues to handle commands
        return this._createCommandStream(message$);
      });
  }

  _findOwner() {
    return Rx.Observable.fromPromise(this._discord.fetchUser(this._ownerUserId))
      .do((user) => this._owner = user);
  }

  _isCommand(message) {
    if (message.content.indexOf('!') !== 0) { return false; }

    let commandName = message.content.split(' ')[0].slice(1);
    return typeof this.commands[commandName] !== 'undefined';
  }

  _argsIncludeHelpFlag(args) {
    return args.indexOf('--help') !== -1 || args.indexOf('-h') !== -1;
  }

  _runCommand(message) {
    let commandParts = message.content.split(' ');
    let commandName = commandParts[0].slice(1);
    let argsArray = commandParts.slice(1);
    let command = this.commands[commandName];

    if (this._argsIncludeHelpFlag(argsArray)) {
      return command.helpResponse(message).respondTo(message);
    }

    if (argsArray.length < command.requiredArgs.length) {
      let response = command.helpResponse(message);
      response.content = "I'm missing some information for that command:";
      return response.respondTo(message);
    }

    let argsObject = {};
    command.args.forEach((cmdArg, index) => {
      let msgArg = argsArray[index];

      if (!msgArg) {
        argsObject[cmdArg.name] = cmdArg.default;
      } else {
        argsObject[cmdArg.name] = msgArg;
      }
    });

    let context = new CommandContext(message, argsObject, this);
    return command.run(context)
      .flatMap((response) => response.respondTo(message));
  }

  _createNewGameStream() {
    return Rx.Observable.merge([
      this._setNewGame(),
      Rx.Observable.interval(300000)
        .flatMap(() => this._setNewGame()),
    ]);
  }

  _setNewGame() {
    return Rx.Observable.just(this.getRandomGame())
      .flatMap((newGame) => this.discord.user.setGame(newGame));
  }
}

module.exports = Nix;
