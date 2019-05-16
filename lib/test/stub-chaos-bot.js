const { throwError, Subject, ReplaySubject } = require('rxjs/index');
const { take, tap, flatMap, merge } = require('rxjs/operators/index');

const Discord = require('discord.js');
const { MockUser, MockClientUser } = require("../../lib/test/mocks/discord.mocks");

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

  chaosBot.testCmdMessage = (message) => {
    const responses = new ReplaySubject();

    chaosBot.streams.postCommand$.pipe(
      merge(chaosBot.errors$.pipe(
        flatMap((error) => throwError(error)),
      )),
      take(1),
      tap(({ response }) => chaosBot.logger.debug(`${response.replies} replies for message '${message.context}'`)),
    ).subscribe(
      (data) => responses.next(data),
      (error) => responses.error(error),
      () => responses.complete(),
    );

    chaosBot.discord.emit('message', message);

    return responses;
  };

  const owner = new MockUser({
    client: chaosBot.discord,
    data: {
      id: chaosBot.config.ownerUserId,
    },
  });
  chaosBot.discord.users.set(owner.id, owner);

  return chaosBot;
};