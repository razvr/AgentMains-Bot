const { of } = require('rxjs');
const { tap, flatMap } = require('rxjs/operators');

const createChaosStub = require('../create-chaos-stub');
const { MockGuild, MockTextChannel, MockMessage } = require("../mocks/discord.mocks");

describe('Feature: Commands', function () {
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
      name: "test-plugin",
      commands: [],
    };

    this.command = {
      name: "test",
      pluginName: this.plugin.name,
      args: [],
      run: sinon.fake(),
    };

    this.commandService = this.chaos.getService('core', 'CommandService');
    this.pluginService = this.chaos.getService('core', 'pluginService');
    sinon.stub(this.commandService, 'canSendMessage').returns(of(true));

    this.chaos.addPlugin(this.plugin);

    this.chaos.listen().pipe(
      flatMap(() => this.pluginService.enablePlugin(this.guild.id, this.plugin.name)),
    ).subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  it('runs basic commands', function (done) {
    this.message.content = '!test';
    this.chaos.addCommand(this.command);

    this.chaos.testCmdMessage(this.message).pipe(
      tap(() => expect(this.command.run).to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('runs commands with arguments', function (done) {
    this.message.content = '!test value1 value2';
    this.command.args = [
      { name: 'normal' },
      { name: 'required', required: true },
      { name: 'optional' },
      { name: 'default', default: 'value4' },
    ];

    this.chaos.addCommand(this.command);

    this.chaos.testCmdMessage(this.message).pipe(
      tap(() => {
        expect(this.command.run).to.have.been.calledWith(sinon.match({
          args: {
            normal: 'value1',
            required: 'value2',
            optional: undefined,
            default: 'value4',
          },
        }));
      }),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('returns a help message when a command is missing required arguments', function (done) {
    this.message.content = '!test value1';
    this.channel.send = sinon.fake.resolves(true);
    this.command.args = [
      { name: 'param1' },
      { name: 'param2', required: true },
    ];

    this.chaos.addCommand(this.command);

    this.chaos.testCmdMessage(this.message).pipe(
      tap(() => {
        expect(this.command.run).not.to.have.been.called;
        expect(this.channel.send).to.have.been.calledWith("I'm sorry, but I'm missing some information for that command:");
      }),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('does not run commands that the user does not have permission to run', function (done) {
    this.message.content = '!test';

    this.command.permissions = ['test'];
    this.chaos.addPermissionLevel('test');
    this.chaos.addCommand(this.command);

    this.chaos.testCmdMessage(this.message).pipe(
      tap(() => expect(this.command.run).not.to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('does not run commands that part of disabled plugins', function (done) {
    this.message.content = '!test';
    this.chaos.addCommand(this.command);

    of('').pipe(
      flatMap(() => this.pluginService.disablePlugin(this.guild.id, this.plugin.name)),
      flatMap(() => this.chaos.testCmdMessage(this.message)),
      tap(() => expect(this.command.run).not.to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('does not run commands that are explicitly disabled', function (done) {
    this.message.content = '!test';
    this.chaos.addCommand(this.command);

    of('').pipe(
      flatMap(() => this.commandService.disableCommand(this.message.guild.id, this.command.name)),
      flatMap(() => this.chaos.testCmdMessage(this.message)),
      tap(() => expect(this.command.run).not.to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('runs commands that are not explicitly disabled', function (done) {
    this.message.content = '!test';
    this.chaos.addCommand(this.command);

    this.chaos.testCmdMessage(this.message).pipe(
      tap(() => expect(this.command.run).to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });
});
