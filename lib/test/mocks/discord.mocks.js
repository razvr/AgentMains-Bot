const Discord = require('discord.js');

class MockClient {
  constructor(client = {}) {
    console.warn("MockMessage is deprecated. Please use createMessage on a stubbed chaos bot instead.");
    if (client instanceof MockClient) return client;

    this.users = client.users || new Discord.Collection();
    this.guilds = client.guilds || new Discord.Collection();

    this.user = client.user || new MockClientUser({
      client: this,
    });

    this.destroy = () => Promise.resolve(true);
    this.login = () => Promise.resolve(true);
  }

  fetchUser(userId) {
    if (this.users.has(userId)) {
      return Promise.resolve(this.users.get(userId));
    } else {
      return Promise.reject(new Discord.DiscordAPIError("/api/v7/users/99999", {
        message: "Unknown User",
      }));
    }
  }
}

class MockClientUser {
  constructor(clientUser = {}) {
    console.warn("MockMessage is deprecated. Please use createMessage on a stubbed chaos bot instead.");
    if (clientUser instanceof MockClientUser) return clientUser;

    this.client = clientUser.client || new MockClient({});
    this.id = clientUser.id || Discord.SnowflakeUtil.generate();
  }

  send(msg) {
    return new Promise((resolve) => resolve(msg));
  }
}

class MockGuild {
  constructor(guild = {}) {
    console.warn("MockMessage is deprecated. Please use createMessage on a stubbed chaos bot instead.");
    if (guild instanceof MockGuild) return guild;

    this.client = guild.client || new MockClient();
    this.id = guild.id || Discord.SnowflakeUtil.generate();

    this.roles = guild.roles || new Discord.Collection();
    this.members = guild.members || new Discord.Collection();

    Object.assign(this, guild);

    this.client.guilds.set(this.id, this);
  }
}

class MockUser {
  constructor(user = {}) {
    console.warn("MockMessage is deprecated. Please use createMessage on a stubbed chaos bot instead.");
    if (user instanceof MockUser) return user;

    this.client = new MockClient(user.client);
    this.id = user.id || Discord.SnowflakeUtil.generate();

    if (user.tag) {
      const [username, discriminator] = user.tag.split('#');
      this.username = username;
      this.discriminator = discriminator;
      delete user.tag;
    }

    Object.assign(this, user);

    this.client.users.set(this.id, this);
  }

  get tag() {
    return `${this.username}#${this.discriminator}`;
  }

  send(msg) {
    return new Promise((resolve) => resolve(msg));
  }
}

class MockRole {
  constructor(role = {}) {
    console.warn("MockMessage is deprecated. Please use createMessage on a stubbed chaos bot instead.");
    if (role instanceof MockRole) return role;

    this.client = role.client || new MockClient();
    this.guild = role.guild || new MockGuild({
      client: this.client,
    });

    this.id = role.id || Discord.SnowflakeUtil.generate();

    Object.assign(this, role);

    this.guild.roles.set(this.id, this);
  }
}

class MockChannel {
  constructor(channel = {}) {
    console.warn("MockMessage is deprecated. Please use createMessage on a stubbed chaos bot instead.");
    if (channel instanceof MockChannel) return channel;

    this.client = channel.client || new MockClient();
    this.guild = channel.guild || new MockGuild({
      client: this.client,
    });

    this.type = channel.type || 'text';
    this.id = channel.id || Discord.SnowflakeUtil.generate();

    Object.assign(this, channel);
  }

  send(msg) {
    return new Promise((resolve) => resolve(msg));
  }

  // noinspection JSMethodCanBeStatic
  permissionsFor() {
    return {
      has: () => true,
    };
  }
}

class MockGuildMember {
  constructor(guildMember = {}) {
    console.warn("MockMessage is deprecated. Please use createMessage on a stubbed chaos bot instead.");
    if (guildMember instanceof MockGuildMember) return guildMember;

    this.client = guildMember.client || new MockClient();

    this.guild = guildMember.guild || new MockGuild({
      client: this.client,
    });

    this.user = guildMember.user || new MockUser({
      client: this.client,
    });

    this.content = guildMember.content || "";

    this.roles = guildMember.roles || new Discord.Collection();

    Object.assign(this, guildMember);
  }

  get id() {
    return this.user.id;
  }

  addRole(role) {
    this.roles.set(role.id, role);
    return Promise.resolve(this);
  }

  addRoles(roles) {
    roles.forEach((role) => this.roles.set(role.id, role));
    return Promise.resolve(this);
  }

  removeRole(role) {
    this.roles.delete(role.id);
    return Promise.resolve(this);
  }

  removeRoles(roles) {
    roles.forEach((role) => this.roles.delete(role.id));
    return Promise.resolve(this);
  }
}

class MockMessage {
  constructor(message = {}) {
    console.warn("MockMessage is deprecated. Please use createMessage on a stubbed chaos bot instead.");

    if (message instanceof MockMessage) return message;

    this.client = message.client || new MockClient();

    this.id = message.id || Discord.SnowflakeUtil.generate();
    this.content = message.content || "";

    this.guild = message.guild || new MockGuild({
      client: this.client,
    });

    this.author = message.author || new MockUser({
      client: this.client,
    });

    this.member = message.member || new MockGuildMember({
      client: this.client,
      guild: this.guild,
      user: this.author,
    });

    this.channel = message.channel || new MockChannel({
      client: this.client,
      guild: this.guild,
      type: 'text',
    });

    Object.assign(this, message);
  }

  reply(msg) {
    return Promise.resolve(msg);
  }
}

module.exports = {
  MockClient,
  MockClientUser,
  MockGuild,
  MockGuildMember,
  MockMessage,
  MockRole,
  MockChannel,
  MockTextChannel: MockChannel,
  MockUser,
};
