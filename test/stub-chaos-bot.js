const Rx = require('rx');

const mocks = require('./mocks');

module.exports = (chaosBot) => {
  chaosBot.stubService = (moduleName, serviceName, service) => {
    let serviceKey = `${moduleName}.${serviceName}`.toLowerCase();
    chaosBot.servicesManager._services[serviceKey] = service;
  };

  chaosBot.handleError = (error) => {
    return Rx.Observable.throw(error);
  };

  chaosBot.discord.login = () => {
    if (!chaosBot.discord.user) {
      return chaosBot.discord.fetchUser(chaosBot.config.ownerUserId)
        .then((user) => {
          chaosBot.discord.user = user;
          return "";
        });
    } else {
      return new Promise((resolve) => resolve(""));
    }
  };

  chaosBot.discord.fetchUser = (id) => {
    return new Promise((resolve) => {
      if (chaosBot.discord.users.has(id)) {
        return resolve(chaosBot.discord.users.get(id));
      } else {
        const user = mocks.discord.build('User', {
          client: chaosBot.discord,
          id,
        });

        chaosBot.discord.users.set(user.id, user);

        return resolve(chaosBot.discord.users.get(id));
      }
    });
  };

  chaosBot.discord.destroy = () => {
    return new Promise((resolve) => resolve());
  };

  return chaosBot;
};