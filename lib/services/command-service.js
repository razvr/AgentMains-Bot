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

  onNixJoinGuild(guild) {
    return this.nix.dataService
      .getGuildData(guild.id, 'core.commandPrefix')
      .do((prefix) => this.prefixes[guild.id] = prefix)
      .do(() => this.nix.logger.info(`Loaded prefix ${this.prefixes[guild.id]} for guild ${guild.id}`));
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
    command = new Command(command);
    this.nix.logger.verbose(`adding command: ${command.name}`);
    this.commands[command.name.toLowerCase()] = command;
  }

  getCommand(commandName) {
    return this.commands[commandName.toLowerCase()];
  }

  msgIsCommand(message) {
    let prefixes = this.getPrefixesForMessage(message);
    if (!CommandParser.isCommand(message, prefixes)) {
      return false;
    }

    let commandName = CommandParser.getCommandName(message, prefixes);
    return typeof this.getCommand(commandName) !== 'undefined';
  }

  runCommandForMsg(message) {
    let prefixes = this.getPrefixesForMessage(message);
    let commandName = CommandParser.getCommandName(message, prefixes);

    let command = this.getCommand(commandName);
    if(!command) {
      return Rx.Observable.throw(new Error('Message is not a valid command'));
    }

    let paramsString = CommandParser.getParamsString(message, prefixes);
    let params = CommandParser.processParams(command, paramsString);

    let context = new Context(message, this.nix, params);
    let response = new Response(message);

    return Rx.Observable
      .return()
      .do(() => this.nix.logger.debug(`=== checking command: ${command.name}`))
      .flatMap(() => this.filterCanSendMessage(context.channel))
      .flatMap(() => this.filterCommandEnabled(context.guild.id, commandName))
      .flatMap(() => this.filterHasPermission(context, commandName))
      .flatMap(() => this._filterHelpFlag(command, context, response))
      .flatMap(() => this._filterMissingArgs(command, context, response))
      .do(() => this.nix.logger.debug(`=== running command: ${command.name}`))
      .map(() => command.run(context, response))
      .flatMap((cmdExit) => {
        if (typeof cmdExit === 'undefined') { return Rx.Observable.return(); }
        if (cmdExit instanceof Rx.Observable) { return cmdExit; }
        if (typeof cmdExit.then === 'function') { return Rx.Observable.fromPromise(cmdExit); }
        return Rx.Observable.return();
      })
      .do(() => this.nix.logger.debug(`=== command complete: ${command.name}`))
      .catch((error) => this.nix.handleError(context, error));
  }

  enableCommand(guildId, commandName) {
    if (!this.commands[commandName]) {
      return Rx.Observable.throw(new Error(`Command does not exist`));
    }

    return this.nix.dataService
      .getGuildData(guildId, 'core.enabledCommands')
      .do((commands) => commands[commandName] = true)
      .flatMap((commands) => this.nix.dataService
        .setGuildData(guildId, 'core.enabledCommands', commands))
      .map((commands) => commands[commandName]);
  }

  disableCommand(guildId, commandName) {
    // required commands must always be enabled
    if (REQUIRED_COMMANDS.includes(commandName)) {
      return Rx.Observable.throw(new Error(`Required command can not be disabled`));
    }

    if (!this.commands[commandName]) {
      return Rx.Observable.throw(new Error(`Command does not exist`));
    }

    return this.nix.dataService
      .getGuildData(guildId, 'core.enabledCommands')
      .do((commands) => commands[commandName] = false)
      .flatMap((commands) =>
        this.nix.dataService
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
    return this.nix.dataService
      .setGuildData(context.guild.id, 'core.commandPrefix', prefix)
      .do((newPrefix) => this.prefixes[context.guild.id] = newPrefix);
  }

  isCommandEnabled(guildId, commandName) {
    let command = this.getCommand(commandName);
    if (typeof command === 'undefined') {
      return Rx.Observable.return(false);
    }

    if (command.moduleName === 'core') {
      // core commands are always enabled
      return Rx.Observable.return(true);
    }

    return Rx.Observable
      .if(
        () => command.moduleName,
        this.nix.moduleService.isModuleEnabled(guildId, command.moduleName),
        Rx.Observable.return(true) //commands not part of a module are enabled, at least in the module sense
      )
      .filter(Boolean) //gate out false values
      .flatMap(() => this.nix.dataService.getGuildData(guildId, 'core.enabledCommands'))
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
      .do((allowed) => this.nix.logger.debug(`filterCommandEnabled: ${allowed}`))
      .filter(Boolean);
  }

  canSendMessage(channel) {
    let botUser = this.nix.discord.user;
    let permissions = channel.permissionsFor(botUser);
    return Rx.Observable.return(permissions.has(Discord.Permissions.FLAGS.SEND_MESSAGES));
  }

  filterCanSendMessage(channel) {
    return this.canSendMessage(channel)
      .do((allowed) => this.nix.logger.debug(`filterCanSendMessage: ${allowed}`))
      .filter(Boolean);
  }

  filterHasPermission(context, commandName) {
    return this.nix.permissionsService
      .filterHasPermission(context, commandName);
  }

  _filterHelpFlag(command, context, response) {
    if (context.flags['help'] === true) {
      response.type = 'embed';
      response.content = this.nix.responseStrings.commandParsing.help({});
      response.embed = command.helpEmbed();
      response.send();
      this.nix.logger.debug(`filterHelpFlag: false`);
      return Rx.Observable.empty();
    }
    this.nix.logger.debug(`filterHelpFlag: true`);
    return Rx.Observable.return(true);
  }

  _filterMissingArgs(command, context, response) {
    let ignoreArgReqsFlags = command.flags.filter((f) => f.ignoreArgReqs);
    if (ignoreArgReqsFlags.find((f) => context.flags[f.name])) {
      this.nix.logger.debug(`filterMissingArgs: true`);
      return Rx.Observable.return(true);
    }

    if (command.requiredArgs.some((arg) => typeof context.args[arg.name] === 'undefined')) {
      response.type = 'embed';
      response.content = context.nix.responseStrings.commandParsing.error.missingArgument({});
      response.embed = command.helpEmbed();
      response.send();
      this.nix.logger.debug(`filterMissingArgs: false`);
      return Rx.Observable.empty();
    }
    this.nix.logger.debug(`filterMissingArgs: true`);
    return Rx.Observable.return(true);
  }
}

module.exports = CommandService;
