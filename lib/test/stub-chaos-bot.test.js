const ChaosCore = require('../chaos-core');
const stubChaosBot = require("./stub-chaos-bot");
const { MockClientUser } = require("./mocks/discord.mocks");

describe('stubChaosBot', function () {
  beforeEach(function () {
    this.chaos = new ChaosCore({
      ownerUserId: '100000000',
      loginToken: 'example-token',
      logger: { level: 'warn' },
    });

    stubChaosBot(this.chaos);
  });

  it('marks the bot as stubbed', function () {
    expect(this.chaos.stubbed).to.be.true;
  });

  it('adds #testMessage', function () {
    expect(this.chaos.testMessage).to.be.a('function');
  });

  it('stubs discord#login', async function () {
    await this.chaos.discord.login();
    expect(this.chaos.discord.user).to.be.an.instanceOf(MockClientUser);
  });
});
