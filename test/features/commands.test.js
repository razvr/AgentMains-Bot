const Rx = require('rx');
const createChaosStub = require('../support/create-chaos-stub');
const mocks = require('../mocks');

describe('Feature: Commands', function () {
  beforeEach(function (done) {
    this.chaos = createChaosStub();
    this.discord = this.chaos.discord;
    this.guild = mocks.discord.build('Guild');

    this.channel = mocks.discord.build('TextChannel', {
      guild: this.guild,
    });

    this.message = mocks.discord.build("Message", {
      member: mocks.discord.build('GuildMember', {
        guild: this.guild,
      }),
      guild: this.guild,
      channel: this.channel,
    });

    this.command = {
      name: "test",
      pluginName: 'core',
      args: [],
      run: sinon.fake(),
    };

    this.commandService = this.chaos.getService('core', 'CommandService');
    sinon.stub(this.commandService, 'canSendMessage').returns(Rx.Observable.of(true));

    this.chaos.listen().subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.chaos.listening) {
      this.chaos.shutdown(
        () => done(),
        (error) => done(error),
      );
    } else {
      done();
    }
  });

  it('runs basic commands', function (done) {
    this.message.content = '!test';
    this.chaos.addCommand(this.command);

    this.discord.emit('message', this.message);
    this.chaos.shutdown()
      .do(() => expect(this.command.run).to.have.been.called)
      .subscribe(
        () => done(),
        (error) => done(error),
      );
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

    this.discord.emit('message', this.message);
    this.chaos.shutdown()
      .do(() => {
        expect(this.command.run).to.have.been.calledWith(sinon.match({
          args: {
            normal: 'value1',
            required: 'value2',
            optional: undefined,
            default: 'value4',
          },
        }));
      })
      .subscribe(() => done(), (error) => done(error));
  });

  it('returns a help message when a command is missing required arguments', function (done) {
    this.message.content = '!test value1';
    this.command.args = [
      { name: 'param1' },
      { name: 'param2', required: true },
    ];

    this.chaos.addCommand(this.command);

    this.discord.emit('message', this.message);
    this.chaos.shutdown()
      .do(() => {
        expect(this.command.run).not.to.have.been.called;
        expect(this.channel.send).to.have.been.calledWith("I'm sorry, but I'm missing some information for that command:");
      })
      .subscribe(() => done(), (error) => done(error));
  });

  it('does not run commands that the user does not have permission to run', function (done) {
    this.message.content = '!test';

    this.command.permissions = ['test'];

    this.chaos.addPermissionLevel('test');
    this.chaos.addCommand(this.command);

    this.discord.emit('message', this.message);
    this.chaos.shutdown()
      .do(() => {
        expect(this.command.run).not.to.have.been.called;
      })
      .subscribe(() => done(), (error) => done(error));
  });
});
