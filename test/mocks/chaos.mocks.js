const Rx = require('rx');

const Mockery = require('./mockery');
const seq = Mockery.seq;
const discordMocks = require('./discord.mocks');
const chaosMocks = new Mockery();

chaosMocks.define("Response", {
  embed: null,
  type: "mock_type",
  content: "mock_content",
  send: sinon.fake.returns(Rx.Observable.of('')),
});

chaosMocks.define("Command");

chaosMocks.define("CommandContext", {
  command: seq(() => chaosMocks.create('Command')),
  flags: seq(() => ({})),
  message: seq(() => discordMocks.create('Message')),
});

module.exports = chaosMocks;
