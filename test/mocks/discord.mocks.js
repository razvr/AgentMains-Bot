const Discord = require('discord.js');
const { Collection } = require('discord.js');

class MockClient extends Discord.Client {
  constructor({ data }) {
    super(data);
  }

  login() {
    return new Promise((resolve) => resolve(true));
  }

  fetchUser(userId) {
    return new Promise((resolve, reject) => {
      if (this.users.has(userId)) {
        resolve(this.users.get(userId));
      } else {
        reject(new Discord.DiscordAPIError("/api/v7/users/99999", {
          message: "Unknown User",
        }));
      }
    });
  }
}

class MockClientUser extends Discord.ClientUser {
  constructor({ client, data = {} }) {
    if (!client) {
      client = new MockClient({});
    }

    if (data.tag) {
      const [username, discriminator] = data.tag.split('#');
      data.username = username;
      data.discriminator = discriminator;
      delete data.tag;
    }

    super(
      client,
      {
        id: Discord.SnowflakeUtil.generate(),
        ...data,
      },
    );

    this.client.users.set(this.id, this);
  }

  send(msg) {
    return new Promise((resolve) => resolve(msg));
  }
}

class MockGuild extends Discord.Guild {
  constructor({ client, data = {} }) {
    if (!client) {
      client = new MockClient({});
    }

    super(
      client,
      {
        id: Discord.SnowflakeUtil.generate(),
        emojis: [],
        ...data,
      },
    );

    this.client.guilds.set(this.id, this);
  }
}

class MockUser extends Discord.User {
  constructor({ client, data = {} }) {
    if (data.tag) {
      const [username, discriminator] = data.tag.split('#');
      data.username = username;
      data.discriminator = discriminator;
      delete data.tag;
    }

    super(
      client,
      {
        id: Discord.SnowflakeUtil.generate(),
        ...data,
      },
    );

    this.client.users.set(this.id, this);
  }

  send(msg) {
    return new Promise((resolve) => resolve(msg));
  }
}

class MockRole extends Discord.Role {
  constructor({ guild, data = {} }) {
    if (!guild) {
      guild = new MockGuild({});
    }

    super(
      guild,
      {
        id: Discord.SnowflakeUtil.generate(),
        ...data,
      },
    );

    this.guild.roles.set(this.id, this);
  }
}

class MockTextChannel extends Discord.TextChannel {
  constructor({ guild, data = {}, client }) {
    if (!guild) {
      if (!client) {
        client = new MockClient({});
      }
      guild = new MockGuild({ client });
    }

    super(
      guild,
      {
        id: Discord.SnowflakeUtil.generate(),
        ...data,
      },
    );

    this.guild.channels.set(this.id, this);
  }

  send(msg) {
    return new Promise((resolve) => resolve(msg));
  }

  permissionsFor() {
    return {
      has: () => true,
    };
  }
}

class MockGuildMember extends Discord.GuildMember {
  constructor({ guild, data = {} }) {
    if (!data.user) {
      data.user = new MockUser({
        client: guild.client,
      });
    }

    super(
      guild,
      {
        id: Discord.SnowflakeUtil.generate(),
        roles: new Collection(),
        ...data,
      },
    );

    this.guild.members.set(this.id, this);
  }

  addRole(role) {
    this._roles.set(role.id, role);
    return Promise.resolve(this);
  }

  addRoles(roles) {
    roles.forEach((role) => this.roles.set(role.id, role));
    return Promise.resolve(this);
  }

  removeRole(role) {
    this._roles.delete(role.id);
    return Promise.resolve(this);
  }

  removeRoles(roles) {
    roles.forEach((role) => this.roles.delete(role.id));
    return Promise.resolve(this);
  }
}

class MockMessage extends Discord.Message {
  constructor({ channel, data = {}, client }) {
    if (!client) {
      client = new MockClient({});
    }

    if (!channel) {
      channel = new MockTextChannel({ client });
    }

    if (!data.author) {
      data.author = new MockUser({
        client: client,
      });
    }

    if (channel.guild) {
      new MockGuildMember({
        guild: channel.guild,
        data: {
          user: data.author,
        },
      });
    }

    data = {
      embeds: [],
      attachments: [],
      ...data,
    };

    super(channel, data, client);
  }
}

module.exports = {
  MockClient,
  MockClientUser,
  MockGuild,
  MockGuildMember,
  MockMessage,
  MockRole,
  MockTextChannel,
  MockUser,
};