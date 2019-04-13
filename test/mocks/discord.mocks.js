const { Collection, DiscordAPIError } = require('discord.js');
const Mockery = require('./mockery');
const seq = Mockery.seq;

const discordMocks = new Mockery();

discordMocks.define("Client", {
  guilds: seq(() => new Collection()),
  users: seq(() => new Collection()),

  login: () => {
    return new Promise((resolve) => resolve(true));
  },
  fetchUser: seq(() => function (userId) {
    return new Promise((resolve, reject) => {
      if (this.users.has(userId)) {
        resolve(this.users.get(userId));
      } else {
        reject(new DiscordAPIError("/api/v7/users/99999", {
          message: "Unknown User",
        }));
      }
    });
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
  destroy: () => {
    return new Promise((resolve) => resolve(true));
  },
});

discordMocks.define("Guild", {
  client: seq(() => discordMocks.create('Client')),
  id: seq((index) => `0000${index}`),
  ownerID: seq((_, { client }) => discordMocks.create('User', { client }).id),

  members: seq(() => new Collection()),
  roles: seq(() => new Collection()),
}, {
  builder: (guild) => {
    guild.client.guilds.set(guild.id, guild);
    return guild;
  },
});

discordMocks.define("User", {
  client: seq(() => discordMocks.create('Client')),
  id: seq((index) => `0000${index}`),
  tag: seq((index) => `User${index}#000${index}`),

  send: seq(() => (msg) => new Promise((resolve) => resolve(msg))),
}, {
  builder: (user) => {
    user.client.users.set(user.id, user);
    return user;
  },
});

discordMocks.define("GuildMember", {
  client: seq(() => discordMocks.create('Client')),
  user: seq((_, { client }) => discordMocks.create('User', { client })),
  guild: seq((_, { client }) => discordMocks.create('Guild', { client })),

  roles: [],
}, {
  builder: (member) => {
    if (!member.id) {
      member.id = member.user.id;
    }

    member.guild.members.set(member.id, member);

    return member;
  },
});

discordMocks.define("TextChannel", {
  permissions: seq(() => new Collection()),
  type: 'text',

  send: seq(() => (msg) => new Promise((resolve) => resolve(msg))),
  permissionsFor: seq(() => () => discordMocks.create("Permissions")),
});

discordMocks.define("Message", {
  content: 'This is a message.',
  author: seq(() => discordMocks.create('User')),
  channel: seq(() => discordMocks.create('TextChannel')),

  reply: (msg) => new Promise((resolve) => resolve(msg)),
});

discordMocks.define("Permissions", {
  has: () => false,
});

discordMocks.define("Role", {
  id: seq((index) => `0000${index}`),
  name: seq((index) => `testRole${index}`),

  client: seq(() => discordMocks.create('Client')),
  guild: seq((_, { client }) => discordMocks.create('Guild', { client })),
}, {
  builder: (role) => {
    role.guild.roles.set(role.id, role);
    return role;
  },
});

module.exports = discordMocks;