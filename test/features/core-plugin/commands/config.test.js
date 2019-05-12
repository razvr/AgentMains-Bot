const { of } = require('rxjs');
const { tap, flatMap } = require('rxjs/operators');

const createChaosStub = require('../../../create-chaos-stub');
const { MockGuild, MockTextChannel, MockMessage } = require("../../../mocks/discord.mocks");

describe('Feature: !config', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.discord = this.chaos.discord;
    this.guild = new MockGuild({
      client: this.discord,
    });

    this.channel = new MockTextChannel({
      guild: this.guild,
      data: {
        name: 'testChannel',
      },
    });

    this.message = new MockMessage({
      channel: this.channel,
      client: this.discord,
      data: {},
    });

    this.plugin = {
      name: "test",
      commands: [],
    };

    this.testAction = {
      name: "testAction",
      run: sinon.fake(),
    };

    const commandService = this.chaos.getService('core', 'CommandService');
    const pluginService = this.chaos.getService('core', 'pluginService');
    sinon.stub(commandService, 'canSendMessage').returns(of(true));

    this.chaos.addPlugin(this.plugin);

    this.chaos.listen().pipe(
      flatMap(() => pluginService.enablePlugin(this.guild.id, this.plugin.name)),
    ).subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  context('when the user is an admin', function () {
    beforeEach(function (done) {
      const permissionsService = this.chaos.getService('core', 'PermissionsService');
      permissionsService.addUser(this.guild, 'admin', this.message.author)
        .subscribe(() => done(), (error) => done(error));
    });

    it('runs a config action', function (done) {
      this.message.content = '!config test testAction';
      this.chaos.addConfigAction('test', this.testAction);

      this.chaos.testCmdMessage(this.message).pipe(
        tap(() => expect(this.testAction.run).to.have.been.called),
        tap(({response}) => expect(response.replies).to.have.length(0)),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});
