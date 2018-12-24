const { Collection } = require('discord.js');

Mockery.define("Client", {
  guilds: new Collection(),

  login: fake.resolves(true),
  fetchUser: fake((userId) => {
    return new Promise((resolve) => {
      resolve(Mockery.create("User", {
        id: userId,
      }));
    });
  }),
  addEventListener: fake(),
  removeEventListener: fake(),
  destroy: fake.resolves(true),
});

Mockery.define("Guild");

Mockery.define("User", {
  id: Mockery.seq((index) => `User-${index}`),

  send: fake((msg) => new Promise((resolve) => resolve(msg))),
});

Mockery.define("GuildMember");

Mockery.define("TextChannel", {
  permissions: new Collection(),

  permissionsFor: Mockery.seq(() => fake.returns(Mockery.create("Permissions"))),
});

Mockery.define("Message", {
  author: Mockery.seq(() => Mockery.create('User')),
  channel: Mockery.seq(() => Mockery.create('TextChannel')),
});

Mockery.define("Permissions", {
  has: fake.returns(false),
});
