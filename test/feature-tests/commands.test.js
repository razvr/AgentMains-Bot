const { of, Subject, ReplaySubject } = require('rxjs');
const { take, tap, flatMap } = require('rxjs/operators');

const createChaosStub = require('../../lib/test/create-chaos-stub');
const { MockMessage } = require("../../lib/test/mocks/discord.mocks");

describe('Feature: Commands', function () {
  beforeEach(async function () {
    this.chaos = createChaosStub();
    this.message = new MockMessage();

    this.plugin = {
      name: "test-plugin",
      commands: [],
    };

    this.command = {
      name: "test",
      args: [],
      run: sinon.fake(),
    };

    const responses$ = new Subject();
    this.chaos.on('chaos.response', (response) => responses$.next(response));

    this.testMessage = (message) => {
      const cmdResponses = new ReplaySubject();
      responses$.pipe(
        take(1),
        tap((response) => {
          cmdResponses.next({ response });
          cmdResponses.complete();
        }),
      ).subscribe();

      this.chaos.discord.emit('message', message);

      return cmdResponses;
    };

    this.commandService = this.chaos.getService('core', 'CommandService');
    this.pluginService = this.chaos.getService('core', 'pluginService');
    sinon.stub(this.commandService, 'canSendMessage').returns(of(true));

    this.chaos.addPlugin(this.plugin);

    await this.chaos.listen();
    await this.pluginService.enablePlugin(this.message.guild.id, this.plugin.name).toPromise();
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
    this.chaos.addCommand(this.plugin.name, this.command);

    this.testMessage(this.message).pipe(
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

    this.chaos.addCommand(this.plugin.name, this.command);

    this.testMessage(this.message).pipe(
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
    this.message.channel.send = sinon.fake.resolves(true);
    this.command.args = [
      { name: 'param1' },
      { name: 'param2', required: true },
    ];

    this.chaos.addCommand(this.plugin.name, this.command);

    this.testMessage(this.message).pipe(
      tap(() => {
        expect(this.command.run).not.to.have.been.called;
        expect(this.message.channel.send).to.have.been.calledWith(
          "I'm sorry, but I'm missing some information for that command:",
        );
      }),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('does not run commands that the user does not have permission to run', function (done) {
    this.message.content = '!test';

    this.command.permissions = ['test'];
    this.chaos.addPermissionLevel('test');
    this.chaos.addCommand(this.plugin.name, this.command);

    this.testMessage(this.message).pipe(
      tap(() => expect(this.command.run).not.to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('does not run commands that part of disabled plugins', function (done) {
    this.message.content = '!test';
    this.chaos.addCommand(this.plugin.name, this.command);

    of('').pipe(
      flatMap(() => this.pluginService.disablePlugin(this.message.guild.id, this.plugin.name)),
      flatMap(() => this.testMessage(this.message)),
      tap(() => expect(this.command.run).not.to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('does not run commands that are explicitly disabled', function (done) {
    this.message.content = '!test';
    this.chaos.addCommand(this.plugin.name, this.command);

    of('').pipe(
      flatMap(() => this.commandService.disableCommand(this.message.guild.id, this.command.name)),
      flatMap(() => this.testMessage(this.message)),
      tap(() => expect(this.command.run).not.to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });

  it('runs commands that are not explicitly disabled', function (done) {
    this.message.content = '!test';
    this.chaos.addCommand(this.plugin.name, this.command);

    this.testMessage(this.message).pipe(
      tap(() => expect(this.command.run).to.have.been.called),
    ).subscribe(() => done(), (error) => done(error));
  });
});
