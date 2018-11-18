class Collection {
  constructor() {
    this.items = [];

    this.map = this.items.map.bind(this.items);
  }

  get size() {
    return this.items.length;
  }

  values() {
    return this.items;
  }

  array() {
    return this.items;
  }
}

class MockClient {
  constructor() {
    this.login = () => new Promise((resolve) => resolve(true));

    this.fetchUser = () => new Promise((resolve) => resolve({
      tag: 'mock_user',
      send: sinon.fake.resolves(''),
    }));

    this.guilds = new Collection();

    this.addEventListener = () => {};
    this.removeEventListener = () => {};

    this.destroy = () => new Promise((resolve) => resolve(true));
  }
}

module.exports = MockClient;
