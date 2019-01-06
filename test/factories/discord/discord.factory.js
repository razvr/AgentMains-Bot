const { Collection } = require('discord.js');
create = Mockery.create;
seq = Mockery.seq;
define = Mockery.define;

define("Client", {
  guilds: new Collection(),

  login: fake.resolves(true),
  fetchUser: fake((userId) => {
    return new Promise((resolve) => {
      resolve(create("User", {
        id: userId,
      }));
    });
  }),
  addEventListener: fake(),
  removeEventListener: fake(),
  destroy: fake.resolves(true),
});

define("Guild");

define("User", {
  id: seq((index) => `User-${index}`),

  send: fake((msg) => new Promise((resolve) => resolve(msg))),
});

define("GuildMember");

define("TextChannel", {
  permissions: new Collection(),

  permissionsFor: Mockery.seq(() => fake.returns(create("Permissions"))),
});

define("Message", {
  author: seq(() => create('User')),
  channel: seq(() => create('TextChannel')),
});

define("Permissions", {
  has: fake.returns(false),
});
