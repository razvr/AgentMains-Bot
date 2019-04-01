const Rx = require('rx');
create = Mockery.create;
seq = Mockery.seq;
define = Mockery.define;

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
