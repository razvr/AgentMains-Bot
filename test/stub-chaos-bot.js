const mocks = require('./mocks');

module.exports = (chaosBot) => {
  chaosBot.stubService = (moduleName, serviceName, service) => {
    let serviceKey = `${moduleName}.${serviceName}`.toLowerCase();
    chaosBot.servicesManager._services[serviceKey] = service;
  };

  chaosBot.handleError = (error) => {
    return new Promise((resolve, reject) => reject(error));
  };

  chaosBot.discord.login = () => {
    return new Promise((resolve) => {
      if (!chaosBot.discord.user) {
        chaosBot.discord.user = mocks.discord.build('User', {
          id: chaosBot.config.ownerUserId,
        });
      }

      return resolve(chaosBot.discord.user);
    });
  };

  chaosBot.discord.fetchUser = (id) => {
    return new Promise((resolve) => {
      if (chaosBot.discord.users.has(id)) {
        return resolve(chaosBot.discord.users.get(id));
      } else {
        return resolve(mocks.discord.build('User', {
          client: chaosBot.discord,
          id,
        }));
      }
    });
  };

  chaosBot.discord.destroy = () => {
    return new Promise((resolve) => resolve());
  };

  return chaosBot;
};