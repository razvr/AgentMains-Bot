const { zip } = require('rxjs');
const { flatMap, tap } = require('rxjs/operators');

const createChaosStub = require('../create-chaos-stub');
const { MockGuild } = require("../mocks/discord.mocks");

describe('Feature: Plugin Data', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown()
        .subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  it('ChaosCore loads default plugin data onListen', function (done) {
    this.chaos = createChaosStub();
    this.plugin = {
      defaultData: [
        { keyword: "test.data1", data: "test.value1" },
        { keyword: "test.data2", data: "test.value2" },
        { keyword: "test.data3", data: "test.value3" },
      ],
    };

    this.guild = new MockGuild({
      client: this.chaos.discord,
    });

    this.chaos.addPlugin(this.plugin);
    this.chaos.listen().pipe(
      flatMap(() => zip(
        this.chaos.getGuildData(this.guild.id, "test.data1"),
        this.chaos.getGuildData(this.guild.id, "test.data2"),
        this.chaos.getGuildData(this.guild.id, "test.data3"),
      )),
      tap(([data1, data2, data3]) => {
        expect(data1).to.eq("test.value1");
        expect(data2).to.eq("test.value2");
        expect(data3).to.eq("test.value3");
      }),
    ).subscribe(() => done(), (error) => done(error));
  });
});