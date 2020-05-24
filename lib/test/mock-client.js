const Discord = require('discord.js');

class MockClient extends Discord.Client {
  /**
   * Creates a mocked instance of Client that does not communicate with Discord
   * @param {ClientOptions} options
   */
  constructor(options = {}) {
    super(options);

    // Disable communications with Discord
    this.rest = {};
    this.ws = { destroy: () => {}, connect: () => {} };

    this.user = {};
  }

  async login() {}
}

module.exports = MockClient;
