const Rx = require('rx');
const Discord = require('discord.js');

const mocks = require('./mocks');

module.exports = (chaosBot) => {
  chaosBot.stubService = (pluginName, serviceName, service) => {
    let serviceKey = `${pluginName}.${serviceName}`.toLowerCase();
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

  const owner = new mocks.discord.User({
    client: chaosBot.discord,
    data: {
      id: chaosBot.config.ownerUserId,
    },
  });
  chaosBot.discord.users.set(owner.id, owner);

  const user = new mocks.discord.User({
    client: chaosBot.discord,
  });
  chaosBot.discord.user = user;

  return chaosBot;
};