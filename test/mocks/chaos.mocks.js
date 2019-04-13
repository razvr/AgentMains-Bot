const Rx = require('rx');

const Mockery = require('./mockery');
const discordMocks = require('./discord.mocks');
const seq = Mockery.seq;

const chaosMocks = new Mockery();

chaosMocks.define("Plugin", {
  name: "testPlugin",
});

chaosMocks.define("Response", {
  embed: null,
  type: "mock_type",
  content: "mock_content",
  send: seq(() => () => Rx.Observable.of('')),
});

chaosMocks.define("Command", {
  name: 'testCommand',
  description: 'This is a test command',
  run: () => {},
});

chaosMocks.define("CommandContext", {
  command: seq(() => chaosMocks.create('Command')),
  flags: seq(() => ({})),
  message: seq(() => discordMocks.create('Message')),
});

module.exports = chaosMocks;
