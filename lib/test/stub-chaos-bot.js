const Discord = require('discord.js');
const { of, throwError, Subject, ReplaySubject } = require('rxjs');
const { flatMap, take, tap, mapTo, filter, defaultIfEmpty } = require('rxjs/operators');

const Response = require("../models/response");
const CommandContext = require("../models/command-context");
const { MockUser, MockClientUser, MockMessage, MockGuild, MockChannel, MockGuildMember } = require("./mocks/discord.mocks");
const { asPromise } = require("../utility");

const stubChaosBot = (chaosBot) => {
  chaosBot.stubbed = true;

  chaosBot.stubService = (pluginName, serviceName, service) => {
    chaosBot.logger.warn("#stubService is deprecated.");
    let serviceKey = `${pluginName}.${serviceName}`.toLowerCase();
    chaosBot.servicesManager._services[serviceKey] = service;
  };

  chaosBot.errors$ = new Subject();
  chaosBot.handleError = (error) => {
    chaosBot.errors$.next(error);
    return throwError(error);
  };

  chaosBot.discord.login = () => {
    if (!chaosBot.discord.user) {
      chaosBot.discord.user = new MockClientUser({
        client: chaosBot.discord,
      });
    }

    return new Promise((resolve) => resolve(""));
  };

  chaosBot.discord.fetchUser = (id) => {
    return new Promise((resolve, reject) => {
      if (chaosBot.discord.users.has(id)) {
        return resolve(chaosBot.discord.users.get(id));
      } else {
        return reject(new Discord.DiscordAPIError(`/api/v7/users/${id}`, {
          message: "Unknown User",
        }));
      }
    });
  };

  chaosBot.discord.destroy = () => new Promise((resolve) => resolve(""));

  const responses$ = new Subject();
  chaosBot.on('chaos.response', (response) => responses$.next(response));

  chaosBot.testCmdMessage = (message) => {
    chaosBot.logger.warn("#testCmdMessage is deprecated. Please use #testCommand or #testConfigAction");
    const cmdResponses = new ReplaySubject();

    responses$.pipe(
      take(1),
      tap((response) => {
        chaosBot.logger.debug(`${response.replies} replies for message '${message.content}'`);
        cmdResponses.next({ response });
        cmdResponses.complete();
      }),
    ).subscribe();

    chaosBot.discord.emit('message', message);
    return cmdResponses;
  };

  chaosBot.testCommand = testCommand.bind(chaosBot);
  chaosBot.testConfigAction = testConfigAction.bind(chaosBot);

  const owner = new MockUser({
    client: chaosBot.discord,
    id: chaosBot.config.ownerUserId,
  });
  chaosBot.discord.users.set(owner.id, owner);
  chaosBot._owner = owner;

  return chaosBot;
};

function buildMessage(message) {
  if (!message) {
    message = new MockMessage();
  }

  if (!message.guild) {
    message.guild = new MockGuild();
  }

  if (!message.author) {
    message.author = new MockUser();
  }

  if (!message.member) {
    message.member = new MockGuildMember({
      type: 'text',
      guild: message.guild,
      user: message.author,
    });
  }

  if (!message.channel) {
    message.channel = new MockChannel({
      type: 'text',
      guild: message.guild,
    });
  }

  return message;
}

function testCommand({ pluginName, commandName, message = null, args = {}, flags = {} }) {
  message = buildMessage(message);

  const permissionsService = this.getService('core', 'PermissionsService');
  const command = this.getCommand(commandName);
  const context = new CommandContext(message, command, args, flags);
  const response = new Response(message);
  const PluginService = this.getService('core', 'PluginService');

  const test$ = of('').pipe(
    flatMap(() => this.emit('chaos.listen')),
    flatMap(() => PluginService.enablePlugin(message.guild.id, pluginName)),
    flatMap(() => permissionsService.hasPermission(context, context.command.name)),
    filter(Boolean),
    flatMap(() => asPromise(context.command.execCommand(context, response))),
    defaultIfEmpty(''),
    mapTo(response),
  );

  test$.message = message;
  test$.args = args;
  test$.flags = flags;

  return test$;
}

function testConfigAction({ pluginName, actionName, message = null, args = {} }) {
  message = buildMessage(message);

  const configCommand = this.getCommand("config");
  const configAction = this.getConfigAction(pluginName, actionName);
  const context = new CommandContext(message, configCommand, args, {});
  const PluginService = this.getService('core', 'PluginService');

  const test$ = of('').pipe(
    flatMap(() => this.emit('chaos.listen')),
    flatMap(() => PluginService.enablePlugin(message.guild.id, pluginName)),
    flatMap(() => asPromise(configAction.execAction(context))),
    defaultIfEmpty(''),
  );

  test$.message = message;
  test$.args = args;

  return test$;
}

module.exports = stubChaosBot;
