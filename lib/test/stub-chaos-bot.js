const Discord = require('discord.js');

const Response = require("../models/response");
const { MockUser, MockClientUser } = require("./mocks/discord.mocks");

const stubChaosBot = (chaosBot) => {
  applyStubs(chaosBot);

  chaosBot.testMessage = async (message) => {
    if (!chaosBot.listening) {
      throw new Error("Bot is not listening");
    }

    let msgResponse = new Response(message);
    chaosBot.on('chaos.response', (response) => msgResponse = response);
    await chaosBot.emit('message', message);

    return msgResponse.replies;
  };

  return chaosBot;
};

function applyStubs(chaosBot) {
  chaosBot.stubbed = true;

  chaosBot.handleError = (error) => { throw error; };

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

  chaosBot.discord.destroy = () => {
    return new Promise((resolve) => resolve(""));
  };

  const owner = new MockUser({
    client: chaosBot.discord,
    id: chaosBot.config.ownerUserId,
  });
  chaosBot.discord.users.set(owner.id, owner);
  chaosBot.owner = owner;
}

module.exports = stubChaosBot;
