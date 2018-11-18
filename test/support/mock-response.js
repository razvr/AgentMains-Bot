const Rx = require('rx');

class MockResponse {
  constructor() {
    this.embed = null;
    this.type = "mock_type";
    this.content = "mock_content";
    this.send = sinon.fake.returns(Rx.Observable.of(''));
  }
}

module.exports = MockResponse;
