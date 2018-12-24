const Rx = require('rx');

Mockery.define("Response", {
  embed: null,
  type: "mock_type",
  content: "mock_content",
  send: sinon.fake.returns(Rx.Observable.of('')),
});

Mockery.define("Command");

Mockery.define("CommandContext", {
  command: Mockery.seq(() => Mockery.create('Command')),
});
