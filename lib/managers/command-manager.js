const Rx = require('rx');

const Command = require('../models/command');
const Response = require('../models/response');
const Context = require('../models/context');
const CommandParser = require('../utility/command-parser');

const COMMANDS_KEYWORD = 'core.commands';
const REQUIRED_COMMANDS = ['help', 'config'];

class CommandManager {
  constructor (commands = [], defaultPrefix = '!') {
    this._commands = {};
    this.defaultPrefix = defaultPrefix;

    this.prefixes = {};

    commands.forEach((command) => {
      this.addCommand(command);
    });
  }

  get commands () {
    return this._commands;
  }

  onNixListen(nix) {
    let guilds = nix.discord.guilds;
    if (guilds.size === 0) {
      return Rx.Observable.return();
    }

    return Rx.Observable
      .return()
      .flatMap(() => Rx.Observable.from(nix.discord.guilds.values()))
      .flatMap((guild) => this.onNixJoinGuild(nix, guild.id));
  }

  onNixJoinGuild(nix, guildId) {
    return nix.dataManager
      .getGuildData(guildId, 'core.commandPrefix')
      .do((prefix) => this.prefixes[guildId] = prefix)
      .do(() => console.log('{INFO}', 'Loaded prefix', this.prefixes[guildId], 'for guild', guildId));
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
    this.commands[command.name.toLowerCase()] = new Command(command);
  }

  msgIsCommand(message) {
    let prefix = this.getPrefixForChannel(message.channel);

    console.log('{DEBUG}', 'Checking if message is command:');
    console.log('{DEBUG}', '  -> Prefix:', prefix);
    console.log('{DEBUG}', '  -> Content:', message.content);
    if (!message.content.startsWith(prefix)) {
      console.log('{DEBUG}', '  Message does not start with prefix');
      return false;
    }

    let commandName = CommandParser.getCommandName(message, prefix);
    if (typeof this.commands[commandName] !== 'undefined') {
      console.log('{DEBUG}', '  Message is a command');
      return true;
    }
    else {
      console.log('{DEBUG}', '  Message does not have a matching command');
      return false;
    };
  }

  runCommandForMsg(message, nix) {
    let prefix = this.getPrefixForChannel(message.channel);

    let commandName = CommandParser.getCommandName(message, prefix);
    let command = this.commands[commandName];

    let params = CommandParser.getParams(command, message);

    let context = new Context(message, nix, params);
    let response = new Response(message);

    return Rx.Observable
      .return()
      .do(() => console.log('{DEBUG}', 'Checking if command can be run'))
      .flatMap(() => this._filterCommandEnabled(command, context, response))
      .do(() => console.log('{DEBUG}', '  -> Command is enabled'))
      .flatMap(() => this._filterScope(command, context, response))
      .do(() => console.log('{DEBUG}', '  -> Command is in scope'))
      .flatMap(() => this._filterHasPermission(command, context, response))
      .do(() => console.log('{DEBUG}', '  -> User has permission'))
      .flatMap(() => this._filterHelpFlag(command, context, response))
      .do(() => console.log('{DEBUG}', '  -> Message does not have the help flag'))
      .flatMap(() => this._filterMissingArgs(command, context, response))
      .do(() => console.log('{DEBUG}', '  -> Message is not missing arguments'))
      .do(() => console.log('{DEBUG}', '  Command can be run'))
      .map(() => command.run(context, response))
      .do((cmdExit) => console.log('{DEBUG}', 'Command exited with', cmdExit))
      .flatMap((cmdExit) => {
        if (typeof cmdExit === 'undefined') { return Rx.Observable.return(); }
        if (cmdExit instanceof Rx.Observable) { return cmdExit; }
        if (typeof cmdExit.then === 'function') { return Rx.Observable.fromPromise(cmdExit); }
        return Rx.Observable.return();
      })
      .catch((error) => nix.handleError(context, error));
  }

  enableCommand(context, commandName) {
    if (!this.commands[commandName]) {
      return Rx.Observable.throw(new Error(`Command does not exist`));
    }

    return this._getCommandsData(context)
      .do((commands) => commands[commandName] = true)
      .flatMap((commands) => this._setCommandsData(context, commands))
      .map((commands) => commands[commandName]);
  }

  disableCommand(context, commandName) {
    // required commands must always be enabled
    if (REQUIRED_COMMANDS.includes(commandName)) {
      return Rx.Observable.throw(new Error(`Command can not be disabled`));
    }

    if (!this.commands[commandName]) {
      return Rx.Observable.throw(new Error(`Command does not exist`));
    }

    return this._getCommandsData(context)
      .do((commands) => commands[commandName] = false)
      .flatMap((commands) => this._setCommandsData(context, commands))
      .map((commands) => commands[commandName]);
  }

  getPrefixForChannel(channel) {
    let prefix = undefined;

    if (channel.type === 'text') {
      prefix = this.prefixes[channel.guild.id];
    }

    if (typeof prefix === 'undefined') {
      prefix = this.defaultPrefix;
    }

    return prefix;
  }

  setPrefix(context, prefix) {
    return context.nix.dataManager
      .setGuildData(context.guild.id, 'core.commandPrefix', prefix)
      .do((newPrefix) => this.prefixes[context.guild.id] = newPrefix);
  }

  isCommandEnabled(context, commandName) {
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
        context.nix.moduleManager.isModuleEnabled(context.guild.id, command.moduleName),
        Rx.Observable.return(true) //commands not part of a module are enabled, at least in the module sense
      )
      .filter(Boolean) //gate out false values
      .flatMap(() => this._getCommandsData(context))
      .map((commands) => commands[commandName])
      .map((isEnabled) => {
        if(typeof isEnabled === 'undefined') {
          return this.commands[commandName].enabledByDefault;
        }
        return isEnabled;
      })
      .filter(Boolean) //gate out false values
      .defaultIfEmpty(false);
  }

  _getCommandsData(context) {
    return context.nix.dataManager
      .getGuildData(context.guild.id, COMMANDS_KEYWORD)
      .map((commands) => !commands ? {} : commands);
  }

  _setCommandsData(context, commands) {
    return context.nix.dataManager
      .setGuildData(context.guild.id, COMMANDS_KEYWORD, commands);
  }

  _filterCommandEnabled(command, context) {
    return this.isCommandEnabled(context, command.name)
      .filter(Boolean);
  }

  _filterHasPermission(command, context, response) {
    return context.nix.permissionsManager.filterHasPermission(command, context, response);
  }

  _filterHelpFlag(command, context, response) {
    if (context.flags['help'] === true) {
      response.type = 'embed';
      response.content = context.nix.responseStrings.commandParsing.help({});
      response.embed = command.helpEmbed();
      response.send();
      return Rx.Observable.empty();
    }
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
      return Rx.Observable.empty();
    }
    else {
      return Rx.Observable.return(true);
    }
  }

  _filterMissingArgs(command, context, response) {
    let ignoreArgReqsFlags = command.flags.filter((f) => f.ignoreArgReqs);
    if (ignoreArgReqsFlags.find((f) => context.flags[f.name])) {
      return Rx.Observable.return(true);
    }

    if (command.requiredArgs.some((arg) => typeof context.args[arg.name] === 'undefined')) {
      response.type = 'embed';
      response.content = context.nix.responseStrings.commandParsing.error.missingArgument({});
      response.embed = command.helpEmbed();
      response.send();
      return Rx.Observable.empty();
    }
    return Rx.Observable.return(true);
  }
}

CommandManager.COMMANDS_KEYWORD = COMMANDS_KEYWORD;
CommandManager.REQUIRED_COMMANDS = REQUIRED_COMMANDS;

module.exports = CommandManager;
