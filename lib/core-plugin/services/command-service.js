const { of, merge, iif, throwError } = require('rxjs');
const { tap, flatMap, catchError, ignoreElements, map, filter, defaultIfEmpty, every } = require('rxjs/operators');
const Discord = require('discord.js');

const Service = require('../../models/service');
const Response = require('../../models/response');
const CommandParser = require('../../command-parser');
const { toObservable } = require("../../utility");

const REQUIRED_COMMANDS = ['help', 'config'];

class CommandService extends Service {
  constructor(chaos) {
    super(chaos);

    this.defaultPrefix = '!';
    this.prefixes = {};

    if (this.chaos.config.defaultPrefix) {
      this.defaultPrefix = this.chaos.config.defaultPrefix;
    }
  }

  onListen() {
    this.permissionsService = this.chaos.getService('core', 'permissionsService');
    this.pluginService = this.chaos.getService('core', 'pluginService');

    this.chaos.streams.message$.pipe(
      filter((message) => message.channel.type === 'text'),
      filter((message) => this.msgIsCommand(message)),
      flatMap((message) => this.runCommandForMsg(message).pipe(
        this.chaos.notifyError([
          { name: "command$ data", value: message.toString() },
        ]),
      )),
    ).subscribe();
  }

  onJoinGuild(guild) {
    return this.chaos.getGuildData(guild.id, 'core.commandPrefix').pipe(
      tap((prefix) => this.prefixes[guild.id] = prefix),
      tap(() => this.chaos.logger.verbose(`Loaded prefix ${this.prefixes[guild.id]} for guild ${guild.id}`)),
    );
  }

  msgIsCommand(message) {
    this.chaos.logger.debug(`checking if message is a command: ${message.content}`);

    let prefixes = this.getPrefixesForMessage(message);
    if (!CommandParser.isCommand(message, prefixes)) {
      return false;
    }

    let commandName = CommandParser.getCommandName(message, prefixes);

    try {
      this.chaos.getCommand(commandName);
      return true;
    } catch (error) {
      if (error.name === "CommandNotFoundError") {
        return false;
      } else {
        throw error;
      }
    }
  }

  runCommandForMsg(message) {
    this.chaos.logger.debug(`=== parsing command: ${message.content}`);

    let prefixes = this.getPrefixesForMessage(message);
    let context = CommandParser.parse(this.chaos, message, prefixes);
    let response = new Response(message);

    return of('').pipe(
      flatMap(() => this.filterCanRunCommand(context)),
      flatMap(() => toObservable(context.command.execCommand(context, response))),
      catchError((error) => this.handleCmdError(error, context, response)),
    );
  }

  handleCmdError(error, context, response) {
    let userMsg$ = response.send({
      type: 'message',
      content: this.chaos.responseStrings.commandRun.unhandledException.forUser({
        owner: this.chaos.owner,
      }),
    });

    let ownerMsg$ = this.chaos.handleError(error, [
      { name: "Guild", value: context.guild.name },
      { name: "Channel", value: context.channel.name },
      { name: "Author", value: context.author.tag },
    ]);

    return merge(userMsg$, ownerMsg$).pipe(
      ignoreElements(),
    );
  }

  enableCommand(guildId, commandName) {
    let command = this.chaos.getCommand(commandName);

    return this.chaos.getGuildData(guildId, 'core.enabledCommands').pipe(
      tap((commands) => commands[command.name] = true),
      flatMap((commands) => this.setGuildData(guildId, 'core.enabledCommands', commands)),
      map((commands) => commands[command.name]),
    );
  }

  disableCommand(guildId, commandName) {
    let command = this.chaos.getCommand(commandName);

    // required commands must always be enabled
    if (REQUIRED_COMMANDS.includes(commandName)) {
      let error = new Error(`Command ${commandName} is required and can not be disabled.`);
      error.name = "ReqCommandError";
      return throwError(error);
    }

    return this.chaos.getGuildData(guildId, 'core.enabledCommands').pipe(
      tap((commands) => commands[command.name] = false),
      flatMap((commands) => this.chaos.setGuildData(guildId, 'core.enabledCommands', commands)),
      map((commands) => commands[command.name]),
    );
  }

  /**
   * Determine the valid prefixes for the given message
   *
   * @param message
   *
   * @return {String[]}
   */
  getPrefixesForMessage(message) {
    let userId = this.chaos.discord.user.id;

    return [
      this.getPrefixForChannel(message.channel),
      `<@${userId}> `,
      `<@!${userId}> `,
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
    } else {
      return this.defaultPrefix;
    }
  }

  setPrefix(context, prefix) {
    return this.chaos.setGuildData(context.guild.id, 'core.commandPrefix', prefix).pipe(
      tap((newPrefix) => this.prefixes[context.guild.id] = newPrefix),
    );
  }

  isCommandEnabled(guildId, commandName) {
    let command = this.chaos.getCommand(commandName);

    if (command.pluginName === 'core') {
      // core commands are always enabled
      return of(true);
    }

    return merge(
      iif(
        () => command.pluginName,
        this.pluginService.isPluginEnabled(guildId, command.pluginName),
        of(true), //commands not part of a module are enabled, at least in the module sense
      ),
      of('').pipe(
        flatMap(() => this.chaos.getGuildData(guildId, 'core.enabledCommands')),
        map((enabledCommands) => enabledCommands[command.name]),
        filter((enabled) => typeof enabled !== "undefined"),
        defaultIfEmpty(true),
      ),
    ).pipe(
      every(Boolean),
    );
  }

  canSendMessage(channel) {
    let botUser = this.chaos.discord.user;
    let permissions = channel.permissionsFor(botUser);
    return of(permissions.has(Discord.Permissions.FLAGS.SEND_MESSAGES));
  }

  filterCanRunCommand(context) {
    return of('').pipe(
      flatMap(() => this.filterCanSendMessage(context.channel)),
      flatMap(() => this.filterCommandEnabled(context.guild.id, context.command.name)),
      flatMap(() => this.filterHasPermission(context, context.command.name)),
    );
  }

  filterCanSendMessage(channel) {
    return this.canSendMessage(channel).pipe(
      tap((allowed) => this.chaos.logger.debug(`filterCanSendMessage to ${channel.name}: ${allowed}`)),
      filter(Boolean),
    );
  }

  filterCommandEnabled(guildId, commandName) {
    return this.isCommandEnabled(guildId, commandName).pipe(
      tap((allowed) => this.chaos.logger.debug(`filterCommandEnabled for ${commandName}: ${allowed}`)),
      catchError((error) => {
        if (error.name === "CommandNotFoundError") {
          return of(false);
        } else {
          return throwError(error);
        }
      }),
      filter(Boolean),
    );
  }

  filterHasPermission(context, commandName) {
    return this.permissionsService.filterHasPermission(context, commandName);
  }
}

module.exports = CommandService;
