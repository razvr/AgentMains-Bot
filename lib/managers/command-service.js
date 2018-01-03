const Rx = require('rx');
const Discord = require('discord.js');

const Command = require('../models/command');
const Response = require('../models/response');
const Context = require('../models/context');
const CommandParser = require('../utility/command-parser');

const REQUIRED_COMMANDS = ['help', 'config'];

class CommandService {
  constructor (nix, commands = [], defaultPrefix = '!') {
    this.nix = nix;

    this.commands = {};
    this.defaultPrefix = defaultPrefix;
    this.prefixes = {};

    commands.forEach((command) => {
      this.addCommand(command);
    });
  }

  onNixListen() {
    let guilds = this.nix.discord.guilds;
    if (guilds.size === 0) {
      return Rx.Observable.return();
    }

    return Rx.Observable
      .return()
      .flatMap(() => Rx.Observable.from(this.nix.discord.guilds.values()))
      .flatMap((guild) => this.onNixJoinGuild(guild));
  }

  onNixJoinGuild(guild) {
    return this.nix.data
      .getGuildData(guild.id, 'core.commandPrefix')
      .do((prefix) => this.prefixes[guild.id] = prefix)
      .do(() => console.log('{INFO}', 'Loaded prefix', this.prefixes[guild.id], 'for guild', guild.id));
  }

  /**
   * Registers a new command
   *
   * @param command {Object}
   *   @param command.name {string} The name of the command
   *   @param command.description {string} The description of the command
   *   @param command.args {Array<Object>} List of arguments for the command
   *     @pram command.args[].name {string} The name of the argument
   *     @pram command.args[].description {string} The description of the argument
   *     @pram command.args[].required {boolean} Mark the argument as required
   *     @pram command.args[].showInHelp {boolean} Hide or show argument in the help list
   *   @param command.flags {Array<Object>} List of flags for the command
   *     @pram command.flags[].name {string} The name of the flag
   *     @pram command.flags[].description {string} The description of the flag
   *     @pram command.flags[].required {boolean} Mark the flag as required
   *     @pram command.flags[].type {string} The type of the flag. Can be "string", or "boolean"
   *     @pram command.flags[].showInHelp {boolean} Hide or show flag in the help list
   *   @param command.adminOnly {boolean} Hide the command unless the caller is an admin
   *   @param command.showInHelp {boolean} Hide or show command in the help list
   *   @param command.enabledByDefault {boolean} Sets the command as enabled by default when first added to a server
   *   @param command.run {function(Context): ObservableOrPromise} function to call as the body of the command
   */
  addCommand(command) {
    console.log('{INFO}', 'adding command:', command.name);
    this.commands[command.name.toLowerCase()] = new Command(command);
  }

  msgIsCommand(message) {
    let prefixes = this.getPrefixesForMessage(message);
    if (!CommandParser.isCommand(message, prefixes)) {
      return false;
    }

    let commandName = CommandParser.getCommandName(message, prefixes);
    return typeof this.commands[commandName] !== 'undefined';
  }

  runCommandForMsg(message) {
    let prefixes = this.getPrefixesForMessage(message);
    let commandName = CommandParser.getCommandName(message, prefixes);

    let command = this.commands[commandName];
    if(!command) {
      return Rx.Observable.throw(new Error('Message is not a valid command'));
    }

    let paramsString = CommandParser.getParamsString(message, prefixes);
    let params = CommandParser.processParams(command, paramsString);

    let context = new Context(message, this.nix, params);
    let response = new Response(message);

    return Rx.Observable
      .return()
      .flatMap(() => this.filterCanSendMessage(context.channel))
      .flatMap(() => this.filterCommandEnabled(context.guild.id, commandName))
      .flatMap(() => this._filterScope(command, context, response))
      .flatMap(() => this.filterHasPermission(context, commandName))
      .flatMap(() => this._filterHelpFlag(command, context, response))
      .flatMap(() => this._filterMissingArgs(command, context, response))
      .do(() => console.log('{DEBUG}', '=== running command:', command.name))
      .map(() => command.run(context, response))
      .flatMap((cmdExit) => {
        if (typeof cmdExit === 'undefined') { return Rx.Observable.return(); }
        if (cmdExit instanceof Rx.Observable) { return cmdExit; }
        if (typeof cmdExit.then === 'function') { return Rx.Observable.fromPromise(cmdExit); }
        return Rx.Observable.return();
      })
      .do(() => console.log('{DEBUG}', '=== command complete:', command.name))
      .catch((error) => this.nix.handleError(context, error));
  }

  enableCommand(guildId, commandName) {
    if (!this.commands[commandName]) {
      return Rx.Observable.throw(new Error(`Command does not exist`));
    }

    return this.nix.data
      .getGuildData(guildId, 'core.enabledCommands')
      .do((commands) => commands[commandName] = true)
      .flatMap((commands) => this.nix.data
        .setGuildData(guildId, 'core.enabledCommands', commands))
      .map((commands) => commands[commandName]);
  }

  disableCommand(guildId, commandName) {
    // required commands must always be enabled
    if (REQUIRED_COMMANDS.includes(commandName)) {
      return Rx.Observable.throw(new Error(`Command can not be disabled`));
    }

    if (!this.commands[commandName]) {
      return Rx.Observable.throw(new Error(`Command does not exist`));
    }

    return this.nix.data
      .getGuildData(guildId, 'core.enabledCommands')
      .do((commands) => commands[commandName] = false)
      .flatMap((commands) =>
        this.nix.data
          .setGuildData(guildId, 'core.enabledCommands', commands)
      )
      .map((commands) => commands[commandName]);
  }

  /**
   * Determine the valid prefixes for the given message
   *
   * @param message
   *
   * @return {String[]}
   */
  getPrefixesForMessage(message) {
    return [
      this.getPrefixForChannel(message.channel),
      this.nix.discord.user.toString() + ' ',
    ];
  }

  getPrefix(guildId) {
    let prefix = this.prefixes[guildId];
    if (typeof prefix === 'undefined') {
      prefix = this.defaultPrefix;
    }
    return prefix;
  }

  getPrefixForChannel(channel) {
    if (channel.type === 'text') {
      return this.getPrefix(channel.guild.id);
    }
    else {
      return this.defaultPrefix;
    }
  }

  setPrefix(context, prefix) {
    return this.nix.data
      .setGuildData(context.guild.id, 'core.commandPrefix', prefix)
      .do((newPrefix) => this.prefixes[context.guild.id] = newPrefix);
  }

  isCommandEnabled(guildId, commandName) {
    // required commands must always be enabled
    if (REQUIRED_COMMANDS.includes(commandName)) {
      return Rx.Observable.return(true);
    }

    let command = this.commands[commandName];
    if (typeof command === 'undefined') {
      return Rx.Observable.return(false);
    }

    return Rx.Observable
      .if(
        () => command.moduleName,
        this.nix.moduleService.isModuleEnabled(guildId, command.moduleName),
        Rx.Observable.return(true) //commands not part of a module are enabled, at least in the module sense
      )
      .filter(Boolean) //gate out false values
      .flatMap(() => this.nix.data.getGuildData(guildId, 'core.enabledCommands'))
      .map((enabledCommands) => enabledCommands[commandName])
      .map((isEnabled) => {
        if(typeof isEnabled === 'undefined') {
          return command.enabledByDefault;
        }
        return isEnabled;
      })
      .filter(Boolean) //gate out false values
      .defaultIfEmpty(false);
  }

  filterCommandEnabled(guildId, commandName) {
    return this.isCommandEnabled(guildId, commandName)
      .do((allowed) => console.log('{DEBUG}', 'filterCommandEnabled:', allowed))
      .filter(Boolean);
  }

  canSendMessage(channel) {
    let botUser = this.nix.discord.user;
    let permissions = channel.permissionsFor(botUser);
    return Rx.Observable.return(permissions.has(Discord.Permissions.FLAGS.SEND_MESSAGES));
  }

  filterCanSendMessage(channel) {
    return this.canSendMessage(channel)
      .do((allowed) => console.log('{DEBUG}', 'filterCanSendMessage:', allowed))
      .filter(Boolean);
  }

  filterHasPermission(context, commandName) {
    return this.nix.permissionsManager
      .filterHasPermission(context, commandName);
  }

  _filterHelpFlag(command, context, response) {
    if (context.flags['help'] === true) {
      response.type = 'embed';
      response.content = this.nix.responseStrings.commandParsing.help({});
      response.embed = command.helpEmbed();
      response.send();
      console.log('{DEBUG}', 'filterHelpFlag:', false);
      return Rx.Observable.empty();
    }
    console.log('{DEBUG}', 'filterHelpFlag:', true);
    return Rx.Observable.return(true);
  }

  _filterScope(command, context, response) {
    if (command.scope.length === 0) {
      return Rx.Observable.return(true);
    }
    else if (command.scope.indexOf(context.channel.type) === -1) {
      response.type = 'message';

      if (command.scope.length === 1 && command.scope[0] === 'text') {
        response.content = context.nix.responseStrings.commandParsing.error.wrongScope.textChannelOnly({});
      }
      else {
        response.content = context.nix.responseStrings.commandParsing.error.wrongScope.generic({});
      }

      response.send();
      console.log('{DEBUG}', 'filterScope:', false);
      return Rx.Observable.empty();
    }
    else {
      console.log('{DEBUG}', 'filterScope:', true);
      return Rx.Observable.return(true);
    }
  }

  _filterMissingArgs(command, context, response) {
    let ignoreArgReqsFlags = command.flags.filter((f) => f.ignoreArgReqs);
    if (ignoreArgReqsFlags.find((f) => context.flags[f.name])) {
      console.log('{DEBUG}', 'filterMissingArgs:', true);
      return Rx.Observable.return(true);
    }

    if (command.requiredArgs.some((arg) => typeof context.args[arg.name] === 'undefined')) {
      response.type = 'embed';
      response.content = context.nix.responseStrings.commandParsing.error.missingArgument({});
      response.embed = command.helpEmbed();
      response.send();
      console.log('{DEBUG}', 'filterMissingArgs:', false);
      return Rx.Observable.empty();
    }
    console.log('{DEBUG}', 'filterMissingArgs:', true);
    return Rx.Observable.return(true);
  }
}

module.exports = CommandService;
