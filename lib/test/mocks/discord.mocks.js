const Discord = require('discord.js');

class MockClient extends Discord.Client {
  /**
   * Creates a mocked instance of Client that does not communicate with Discord
   * @param {ClientOptions} options
   */
  constructor(options = {}) {
    super(options);

    // Disable communications with Discord
    this.rest = {};
    this.ws = {
      destroy: () => {},
      connect: () => {},
    };

    this.user = new MockClientUser({
      client: this,
    });
  }

  async login() {}
}

class MockClientUser extends Discord.ClientUser {
  constructor(client, data = {}) {
    super(client, data);
  }
}

class MockGuild extends Discord.Guild {
  constructor(client, data = {}) {
    if (!data.id) data.id = Discord.SnowflakeUtil.generate();
    if (!data.channels) data.channels = [];

    super(client, data);

    this.client.guilds.cache.set(this.id, this);

    // Create everyone role
    new MockRole(this.client, { id: this.id }, this);
  }
}

class MockUser extends Discord.User {
  constructor(client, data = {}) {
    if (!data.id) data.id = Discord.SnowflakeUtil.generate();

    super(client, data);

    this.client.users.cache.set(this.id, this);
  }

  get partial() { return false; }

  get data() {
    return {
      username: this.username,
      discriminator: this.discriminator,
      avatar: this.avatar,
      bot: this.bot,
      system: this.system,
      locale: this.locale,
      flags: this.flags,
      lastMessageID: this.lastMessageID,
      lastMessageChannelID: this.lastMessageChannelID,
    };
  }

  async send() {
  }
}

class MockRole extends Discord.Role {
  constructor(client, data = {}, guild) {
    if (!guild) guild = new MockGuild(client);

    if (!data.id) data.id = Discord.SnowflakeUtil.generate();
    if (!data.name) data.name = 'MockRole';

    super(client, data, guild);

    this.guild.roles.cache.set(this.id, this);
  }
}

class MockGuildChannel extends Discord.GuildChannel {
  constructor(client, data = {}, guild) {
    if (!guild) guild = new MockGuild(client);

    super(guild, data);

    this.guild.channels.cache.set(this.id, this);
  }
}

class MockTextChannel extends Discord.TextChannel {
  constructor(client, data = {}, guild) {
    if (!guild) guild = new MockGuild(client);

    data.type = Discord.Constants.ChannelTypes.TEXT;

    super(guild, data);

    this.guild.channels.cache.set(this.id, this);
  }

  permissionsFor() {
    return { has: () => true };
  }

  async send() {
  }
}

class MockGuildMember extends Discord.GuildMember {
  constructor(client, data = {}, guild) {
    if (!guild) guild = new MockGuild(client);

    if (!data.user) data.user = new MockUser(client).data;

    super(client, data, guild);
    this.guild.members.cache.set(this.id, this);

    this.user = new MockUser(client, data.user);
  }

  get data() {
    return {};
  }
}

class MockMessage extends Discord.Message {
  constructor(client, data = {}, channel) {
    if (!channel) channel = new MockTextChannel(client);

    if (!data.id) data.id = Discord.SnowflakeUtil.generate();

    if (!data.author) data.author = new MockUser(client).data;
    if (!data.member) data.member = new MockGuildMember(client, { user: data.author }, channel.guild).data;

    super(client, data, channel);

    this.author = new MockUser(client, data.author);
  }
}

module.exports = {
  MockClient,
  MockClientUser,
  MockGuild,
  MockGuildMember,
  MockMessage,
  MockRole,
  MockGuildChannel,
  MockTextChannel,
  MockUser,
};
