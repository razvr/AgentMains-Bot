const Response = require("../models/response");
const { MockClient, MockUser } = require("./mocks/discord.mocks");

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
  chaosBot.discord = new MockClient(chaosBot.config.discord);
  chaosBot.handleError = (error) => { throw error; };

  const owner = new MockUser(chaosBot.discord, {
    id: chaosBot.config.ownerUserId,
  });
  chaosBot.discord.users.cache.set(owner.id, owner);
}

module.exports = stubChaosBot;
