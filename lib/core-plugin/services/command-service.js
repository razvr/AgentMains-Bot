const { of, merge, iif, throwError } = require('rxjs');
const {
  tap, flatMap, catchError, ignoreElements, map, filter, defaultIfEmpty, every,
  mapTo,
} = require('rxjs/operators');
const Discord = require('discord.js');

const Service = require('../../models/service');
const Response = require('../../models/response');
const CommandParser = require('../../command-parser');
const DataKeys = require("../datakeys");
const { ReqCommandError } = require("../../errors");
const {
  EnableCommandError, DisableCommandError, PluginDisabledError,
} = require("../../errors");
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

    this.chaos.registerEvent('chaos.command');
    this.chaos.registerEvent('chaos.response');

    this.chaos.on('chaos.listen', () => {
      this.permissionsService = this.chaos.getService('core', 'permissionsService');
      this.pluginService = this.chaos.getService('core', 'pluginService');
    });

    this.chaos.on('guildCreate', async (guild) => {
      this.prefixes[guild.id] = await this.getGuildData(guild.id, 'core.commandPrefix');
      this.chaos.logger.verbose(`Loaded prefix ${this.prefixes[guild.id]} for guild ${guild.id}`);
    });

    this.chaos.on('message', (message) => of(message).pipe(
      this._filterMsgIsCommand(),
      this._filterTextChannels(),
      flatMap((message) => this.chaos.triggerEvent('chaos.command', message)),
    ));

    this.chaos.on('chaos.command', (message) => {
      return this.runCommandForMsg(message).pipe(
        this.chaos.notifyError([
          { name: "command$ data", value: message.toString() },
        ]),
      );
    });
  }

  _filterTextChannels() {
    return (source) => source.pipe(
      flatMap((message) => of('').pipe(
        map(() => message.channel.type === 'text'),
        tap((isText) => this.chaos.logger.debug(`channel type is text: ${isText}`)),
        filter(Boolean),
        mapTo(message),
      )),
    );
  }

  _filterMsgIsCommand() {
    return (source) => source.pipe(
      flatMap((message) => of('').pipe(
        map(() => this.msgIsCommand(message)),
        tap((isCommand) => this.chaos.logger.debug(`message is command: ${isCommand}`)),
        filter(Boolean),
        mapTo(message),
      )),
    );
  }

  msgIsCommand(message) {
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
      flatMap(() => this.canRunCommand(context)),
      filter(Boolean),
      flatMap(() => toObservable(context.command.execCommand(context, response))),
      defaultIfEmpty(''),
      tap(() => this.chaos.triggerEvent('chaos.response', response)),
      catchError((error) => this.handleCmdError(error, context, response)),
    );
  }

  handleCmdError(error, context, response) {
    let userMsg$ = response.send({
      type: 'message',
      content: this.chaos.strings.commandRun.unhandledException.forUser({
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

    return of('').pipe(
      flatMap(() => this._getEnabledCommands(guildId)),
      flatMap((enabledCmds) =>
        enabledCmds[command.name] !== false
          ? throwError(new EnableCommandError(`${command.name} is already enabled.`))
          : of(enabledCmds),
      ),
      tap((enabledCmds) => enabledCmds[command.name] = true),
      flatMap((enabledCmds) => this._setEnabledCommands(guildId, enabledCmds)),
      map((enabledCmds) => enabledCmds[command.name]),
    );
  }

  disableCommand(guildId, commandName) {
    let command = this.chaos.getCommand(commandName);

    // required commands must always be enabled
    if (REQUIRED_COMMANDS.includes(commandName)) {
      let error = new ReqCommandError(`Command ${commandName} is required and can not be disabled.`);
      return throwError(error);
    }

    return of('').pipe(
      flatMap(() => this._getEnabledCommands(guildId)),
      flatMap((enabledCmds) =>
        enabledCmds[command.name] === false
          ? throwError(new DisableCommandError(`${command.name} was already disabled.`))
          : of(enabledCmds),
      ),
      tap((enabledCmds) => enabledCmds[command.name] = false),
      flatMap((enabledCmds) => this._setEnabledCommands(guildId, enabledCmds)),
      map((enabledCmds) => enabledCmds[command.name]),
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
    return of('').pipe(flatMap(async () => {
      let newPrefix = await this.setGuildData(context.guild.id, 'core.commandPrefix', prefix);
      this.prefixes[context.guild.id] = newPrefix;
      return newPrefix;
    }));
  }

  canRunCommand(context) {
    return merge(
      this.canSendMessage(context.channel),
      this.isCommandEnabled(context.guild.id, context.command.name),
      this.permissionsService.hasPermission(context, context.command.name),
    ).pipe(
      every(Boolean),
      catchError((error) => {
        if (error.name === "PluginDisabledError") {
          return of(false);
        } else {
          return throwError(error);
        }
      }),
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
        this.pluginService.isPluginEnabled(guildId, command.pluginName).pipe(
          flatMap((pluginEnabled) =>
            pluginEnabled
              ? of(true)
              : throwError(new PluginDisabledError(`Plugin ${command.pluginName} is disabled.`)),
          ),
        ),
        of(true), //commands not part of a module are enabled, at least in the module sense
      ),
      of('').pipe(
        flatMap(() => this._getEnabledCommands(guildId)),
        map((enabledCmds) => enabledCmds[command.name]),
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
    this.chaos.logger.warn('filterCanRunCommand is deprecated. Please use canRunCommand instead');
    return this.canRunCommand(context).pipe(filter(Boolean));
  }

  filterCanSendMessage(channel) {
    this.chaos.logger.warn('filterCanSendMessage is deprecated. Please use canSendMessage instead');
    return this.canSendMessage(channel).pipe(filter(Boolean));
  }

  filterCommandEnabled(guildId, commandName) {
    this.chaos.logger.warn('filterCommandEnabled is deprecated. Please use isCommandEnabled instead');
    return this.isCommandEnabled(guildId, commandName).pipe(filter(Boolean));
  }

  filterHasPermission(context, commandName) {
    this.chaos.logger.warn('filterHasPermission is deprecated. Please use permissionsService instead');
    return this.permissionsService.hasPermission(context, commandName).pipe(filter(Boolean));
  }

  async _getEnabledCommands(guildId) {
    let data = await this.getGuildData(guildId, DataKeys.ENABLED_COMMANDS);
    return data ? data : {};
  }

  async _setEnabledCommands(guildId, enabledCmds) {
    await this.setGuildData(guildId, DataKeys.ENABLED_COMMANDS, enabledCmds);
    return this._getEnabledCommands(guildId);
  }
}

module.exports = CommandService;
