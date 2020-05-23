Testing
=======

Stubbed Bots
------------
To test features for your plugin, it is recommended to start up a stubbed chaos 
bot using either `ChaosCore.test.createChaosStub` to create a default stubbed bot, or 
`ChaosCore.test.stubChaosBot` to sub out an existing bot. A stubbed bot will not communicate
with Discord.

### createChaosStub(config=null)
Creates a default stubbed chaos bot:

```js
const assert = require('assert').strict;
const { createChaosStub } = require('chaos-core').test;

const chaosBot = createChaosStub();
chaosBot.listen()
  .then(() => {
    assert.equal(chaosBot.listening, true);
  });
```

### stubChaosBot(chaosBot)
Stubs an existing chaos bot:

```js
const assert = require('assert').strict;
const { stubChaosBot } = require('chaos-core').test;
const AwesomeBot = require('./awesome-bot');

const awesomeBot = stubChaosBot(new AwesomeBot()); 
awesomeBot.listen()
  .then(() => {
    assert.equal(awesomeBot.listening, true);
  });
```

Discord Mocks
-------------
```
WARNING: Discord Mocks will be removed in v6
MockMessage can be replaced with createMessage on a stubbed ChaosBot
```
Mock classes for some Discord.js objects are available from `ChaosCore.test.discordMocks`:

- MockClient
- MockClientUser
- MockGuild
- MockGuildMember
- MockMessage
- MockRole
- MockChannel
- MockTextChannel
- MockUser

Testing Commands
----------------
On stubbed bots, the functions `createMessage` and `testMessage` are added to 
allow for testing messages and their responses from the bot.

`createMessage` can be used to create a basic message object that can be used
with `testMessage`. Awaiting `testMessage` will return a response object with 
a list of `.replies` that the bot made to the message.

### Example
```js
const assert = require('assert').strict;
const { createChaosStub } = require('chaos-core').test;

const chaosBot = createChaosStub();

// Create a mock message to test with. MockMessage will create additional mock
// objects for message.guild, .channel, .member, etc... if they are not provided
const message = chaosBot.createMessage({
  content: '!rainboom',
});

chaosBot.listen()
  .then(() => chaosBot.testMessage(message))
  .then((responses) => {
    assert.equal(responses.length, 1);
    assert.equal(responses[0].content, 'This server just got 20% cooler!');
  });
```
