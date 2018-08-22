class MockClient {
  constructor() {
    this.login = sinon.fake.resolves(true);

    this.fetchUser = sinon.fake.resolves({
      tag: 'mock_user',
      send: sinon.fake.resolves(''),
    });

    this.guilds = {
      size: 0,
      values: sinon.fake.returns([]),
      array: sinon.fake.returns([]),
      map: sinon.fake.returns([]),
    };

    this.addEventListener = sinon.fake();
    this.removeEventListener = sinon.fake();

    this.destroy = sinon.fake.resolves(true);
  }
}

module.exports = MockClient;
