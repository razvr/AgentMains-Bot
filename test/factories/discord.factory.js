const { Collection, DiscordAPIError } = require('discord.js');
create = Mockery.create;
seq = Mockery.seq;
define = Mockery.define;

define("Client", {
  guilds: seq(() => new Collection()),
  users: seq(() => new Collection()),

  login: seq(() => fake.resolves(true)),
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
  addEventListener: seq(() => fake()),
  removeEventListener: seq(() => fake()),
  destroy: seq(() => fake.resolves(true)),
});

define("Guild", {
  client: seq(() => create('Client')),
  id: seq((index) => `0000${index}`),
  ownerID: seq((_, { client }) => create('User', { client }).id),
  members: seq(() => new Collection()),
}, {
  builder: (guild) => {
    guild.client.guilds.set(guild.id, guild);
    return guild;
  },
});

define("User", {
  client: seq(() => create('Client')),
  id: seq((index) => `0000${index}`),
  tag: seq((index) => `User${index}#000${index}`),

  send: fake((msg) => new Promise((resolve) => resolve(msg))),
}, {
  builder: (user) => {
    user.client.users.set(user.id, user);
    return user;
  },
});

define("GuildMember", {
  client: seq(() => create('Client')),
  user: seq((_, { client }) => create('User', { client })),
  guild: seq((_, { client }) => create('Guild', { client })),

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

define("TextChannel", {
  permissions: seq(() => new Collection()),
  type: 'text',

  send: seq(() => fake((msg) => new Promise((resolve) => resolve(msg)))),
  permissionsFor: seq(() => fake.returns(create("Permissions"))),
});

define("Message", {
  content: 'This is a message.',
  author: seq(() => create('User')),
  channel: seq(() => create('TextChannel')),

  reply: fake((msg) => new Promise((resolve) => resolve(msg))),
});

define("Permissions", {
  has: seq(() => fake.returns(false)),
});
