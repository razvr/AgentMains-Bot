const Discord = require('discord.js');

const createChaosStub = require('../../lib/test/create-chaos-stub');

describe('Feature: Plugin Data', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
  });

  afterEach(async function () {
    if (this.chaos.listening) {
      await this.chaos.shutdown();
    }
  });

  it('ChaosCore loads default plugin data onListen', async function () {
    this.chaos = createChaosStub();
    this.plugin = {
      defaultData: [
        { keyword: "test.data1", data: "test.value1" },
        { keyword: "test.data2", data: "test.value2" },
        { keyword: "test.data3", data: "test.value3" },
      ],
    };

    this.guild = { id: Discord.SnowflakeUtil.generate() };
    this.chaos.discord.guilds.cache.set(this.guild.id, this.guild);

    this.chaos.addPlugin(this.plugin);
    await this.chaos.listen();

    let [data1, data2, data3] = await Promise.all([
      this.chaos.getGuildData(this.guild.id, "test.data1"),
      this.chaos.getGuildData(this.guild.id, "test.data2"),
      this.chaos.getGuildData(this.guild.id, "test.data3"),
    ]);

    expect(data1).to.eq("test.value1");
    expect(data2).to.eq("test.value2");
    expect(data3).to.eq("test.value3");
  });
});
