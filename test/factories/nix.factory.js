const Rx = require('rx');
const create = Mockery.create;
const seq = Mockery.seq;
const define = Mockery.define;

define("Response", {
  embed: null,
  type: "mock_type",
  content: "mock_content",
  send: sinon.fake.returns(Rx.Observable.of('')),
});

define("Command");

define("CommandContext", {
  command: seq(() => create('Command')),
  flags: seq(() => ({})),
  message: seq(() => create('Message')),
});
