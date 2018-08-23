class MockClient {
  constructor() {
    this.login = () => new Promise((resolve) => resolve(true));

    this.fetchUser = () => new Promise((resolve) => resolve({
      tag: 'mock_user',
      send: sinon.fake.resolves(''),
    }));

    this.guilds = {
      size: 0,
      values: sinon.fake.returns([]),
      array: sinon.fake.returns([]),
      map: sinon.fake.returns([]),
    };

    this.addEventListener = () => {};
    this.removeEventListener = () => {};

    this.destroy = () => new Promise((resolve) => resolve(true));
  }
}

module.exports = MockClient;
