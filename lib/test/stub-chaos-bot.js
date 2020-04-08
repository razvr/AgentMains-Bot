const Discord = require('discord.js');
const { of, Subject } = require('rxjs');
const { flatMap, mapTo, filter, defaultIfEmpty } = require('rxjs/operators');

const Response = require("../models/response");
const CommandContext = require("../models/command-context");
const { MockUser, MockClientUser, MockMessage, MockGuild, MockChannel, MockGuildMember } = require("./mocks/discord.mocks");
const { asPromise } = require("../utility");

const stubChaosBot = (chaosBot) => {
  chaosBot.stubbed = true;
  chaosBot.handleError = () => {};

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
  chaosBot.testCommand = testCommand.bind(chaosBot);
  chaosBot.testConfigAction = testConfigAction.bind(chaosBot);

  chaosBot.testMessage = async ({ channel, member, content }) => {
    if (!chaosBot.listening) {
      throw new Error("Bot is not listening");
    }

    let msgResponse;
    chaosBot.on('chaos.response', (response) => msgResponse = response);

    await chaosBot.emit('message', buildMessage({ channel, member, content }));
    return msgResponse;
  };

  const owner = new MockUser({
    client: chaosBot.discord,
    id: chaosBot.config.ownerUserId,
  });
  chaosBot.discord.users.set(owner.id, owner);
  chaosBot.owner = owner;

  return chaosBot;
};

function buildMessage(message) {
  if (!message) {
    message = new MockMessage();
  }

  if (!message.channel) {
    message.channel = new MockChannel({
      type: 'text',
      guild: message.guild || new MockGuild(),
    });
  }

  if (!message.guild) {
    message.guild = message.channel.guild;
  }

  if (!message.member) {
    message.member = new MockGuildMember({
      type: 'text',
      guild: message.guild,
      user: message.author || new MockUser(),
    });
  }

  if (!message.author) {
    message.author = message.member.user;
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

  test$._message = message;
  Object.defineProperty(test$, 'message', {
    get: () => {
      console.warn('CommandTest.message is deprecated');
      return test$._message;
    },
  });

  test$._args = args;
  Object.defineProperty(test$, 'args', {
    get: () => {
      console.warn('CommandTest.args is deprecated');
      return test$._args;
    },
  });

  test$._flags = flags;
  Object.defineProperty(test$, 'flags', {
    get: () => {
      console.warn('CommandTest.flags is deprecated');
      return test$._flags;
    },
  });

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

  test$._message = message;
  Object.defineProperty(test$, 'message', {
    get: () => {
      console.warn('ConfigActionTest.message is deprecated');
      return test$._message;
    },
  });

  test$._args = args;
  Object.defineProperty(test$, 'args', {
    get: () => {
      console.warn('ConfigActionTest.args is deprecated');
      return test$._args;
    },
  });

  return test$;
}

module.exports = stubChaosBot;
