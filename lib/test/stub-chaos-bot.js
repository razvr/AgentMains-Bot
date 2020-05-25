const Discord = require('discord.js');

const Response = require("../models/response");

const stubChaosBot = (chaosBot) => {
  applyStubs(chaosBot);

  /**
   * Builds a basic message object that can be used with testMessage. Will add
   * All the needed references for the permission system to run commands, but
   * additional properties will need to be manually added to the object.
   *
   * @param msg {Object} Data to create the message from
   * @param msg.content {String} The content of the message
   * @param msg.guild {Object} The guild that the message is from
   * @param msg.channel {Object} The channel that the message is from
   * @param msg.member {Object} The member that sent the message
   * @param msg.author {Object} The user that sent the messagec
   * @returns {Object} a mock message object
   */
  chaosBot.createMessage = (msg = {}) => {
    msg = {
      content: "",
      guild: {},
      channel: {},
      author: {},
      member: {},
      ...msg,
    };

    if (!msg.member.user) {
      msg.member.user = msg.author;
    } else if (msg.member.user !== msg.author) {
      throw Error("The member's user must be the same as the author");
    }

    if (!msg.channel.guild) {
      msg.channel.guild = msg.guild;
    } else if (msg.channel.guild !== msg.guild) {
      throw Error("Channel does not belong to the guild");
    }

    if (!msg.member.guild) {
      msg.member.guild = msg.guild;
    } else if (msg.member.guild !== msg.guild) {
      throw Error("Member does not belong to the guild");
    }

    if (!msg.reply) msg.reply = async () => {};

    if (!msg.guild.id) msg.guild.id = Discord.SnowflakeUtil.generate();
    if (!msg.guild.name) msg.guild.name = 'Mock Guild';
    if (!msg.guild.roles) msg.guild.roles = new Discord.Collection();
    if (!msg.guild.channels) msg.guild.channels = new Discord.Collection();
    if (!msg.guild.members) msg.guild.members = new Discord.Collection();

    if (!msg.channel.id) msg.channel.id = Discord.SnowflakeUtil.generate();
    if (!msg.channel.name) msg.channel.name = 'mock-channel';
    if (!msg.channel.type) msg.channel.type = 'text';
    if (!msg.channel.permissionsFor) msg.channel.permissionsFor = () => ({ has: () => true });
    if (!msg.channel.send) msg.channel.send = async () => {};

    if (!msg.author.id) msg.author.id = Discord.SnowflakeUtil.generate();
    if (!msg.author.tag) msg.author.tag = "TestUser#0000";
    if (!msg.author.send) msg.author.send = async () => {};

    if (!msg.member.id) msg.member.id = msg.author.id;
    if (!msg.member.roles) msg.member.roles = new Discord.Collection();

    return msg;
  };

  chaosBot.testMessage = async (message) => {
    if (!chaosBot.listening) {
      throw new Error("Bot is not listening");
    }

    let msgResponse = new Response(message); // Default empty response
    chaosBot.on('chaos.response', (response) => msgResponse = response);

    chaosBot.logger.debug(`Sending test message: ${message.content}`);
    await chaosBot.emit('message', message);
    chaosBot.logger.debug(`Replies: ${msgResponse.replies.length}`);

    return msgResponse.replies;
  };

  return chaosBot;
};

function applyStubs(chaosBot) {
  chaosBot.stubbed = true;

  chaosBot.handleError = (error) => { throw error; };

  chaosBot.discord.login = () => {
    if (!chaosBot.discord.user) chaosBot.discord.user = {};
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

  const owner = {
    id: chaosBot.config.ownerUserId,
    send: async () => {},
  };
  chaosBot.discord.users.set(owner.id, owner);
  chaosBot.owner = owner;
}

module.exports = stubChaosBot;
