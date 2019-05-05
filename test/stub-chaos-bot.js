const { throwError } = require('rxjs');

const Discord = require('discord.js');
const { MockUser, MockClientUser } = require("./mocks/discord.mocks");

module.exports = (chaosBot) => {
  chaosBot.stubService = (pluginName, serviceName, service) => {
    let serviceKey = `${pluginName}.${serviceName}`.toLowerCase();
    chaosBot.servicesManager._services[serviceKey] = service;
  };

  chaosBot.handleError = (error) => {
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

  const owner = new MockUser({
    client: chaosBot.discord,
    data: {
      id: chaosBot.config.ownerUserId,
    },
  });
  chaosBot.discord.users.set(owner.id, owner);

  return chaosBot;
};