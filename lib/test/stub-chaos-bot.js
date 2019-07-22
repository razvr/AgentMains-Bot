const Discord = require('discord.js');
const { of, throwError, Subject, ReplaySubject } = require('rxjs');
const { flatMap, take, tap } = require('rxjs/operators');

const Response = require("../models/response");
const CommandContext = require("../models/command-context");
const { MockUser, MockClientUser } = require("./mocks/discord.mocks");
const { toObservable } = require("../utility");

module.exports = (chaosBot) => {
  chaosBot.stubService = (pluginName, serviceName, service) => {
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
  chaosBot.addEventListener('chaos.response', (response) => responses$.next(response));

  chaosBot.testCmdMessage = (message) => {
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
    data: {
      id: chaosBot.config.ownerUserId,
    },
  });
  chaosBot.discord.users.set(owner.id, owner);

  return chaosBot;
};

function testCommand({ commandName, message = {}, args = {}, flags = {} }) {
  const command = this.getCommand(commandName);
  const context = new CommandContext(message, command, args, flags);
  const response = new Response(message);

  return of('').pipe(
    flatMap(() => this.emit('chaos.listen')),
    flatMap(() => toObservable(context.command.execCommand(context, response))),
  );
}

function testConfigAction({ pluginName, actionName, message = {}, args = {} }) {
  const configCommand = this.getCommand("config");
  const configAction = this.getConfigAction(pluginName, actionName);
  const context = new CommandContext(message, configCommand, args, {});

  return of('').pipe(
    flatMap(() => this.emit('chaos.listen')),
    flatMap(() => toObservable(configAction.execAction(context))),
  );
}
