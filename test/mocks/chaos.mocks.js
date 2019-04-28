const { of } = require('rxjs');

const Mockery = require('./mockery');
const seq = Mockery.seq;

const chaosMocks = new Mockery();

chaosMocks.define("Plugin", {
  name: "testPlugin",
});

chaosMocks.define("Response", {
  embed: null,
  type: "mock_type",
  content: "mock_content",
  send: seq(() => () => of('')),
});

chaosMocks.define("Command", {
  name: 'testCommand',
  description: 'This is a test command',
  run: () => {},
});

chaosMocks.define("CommandContext", {
  command: seq(() => chaosMocks.create('Command')),
  flags: seq(() => ({})),
});

module.exports = chaosMocks;
