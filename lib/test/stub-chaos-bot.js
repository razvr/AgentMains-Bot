const Discord = require('discord.js');

const Response = require("../models/response");
const { MockUser, MockClientUser, MockMessage, MockGuild, MockChannel, MockGuildMember } = require("./mocks/discord.mocks");

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

  chaosBot.testMessage = async ({ channel, member, content }) => {
    if (!chaosBot.listening) {
      throw new Error("Bot is not listening");
    }
    let message = buildMessage({ channel, member, content });
    let msgResponse = new Response(message);
    chaosBot.on('chaos.response', (response) => msgResponse = response);
    await chaosBot.emit('message', message);
    return msgResponse.replies;
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

module.exports = stubChaosBot;
