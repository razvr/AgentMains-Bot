const Rx = require('rx');

describe('Feature: Commands', function () {
  beforeEach(function (done) {
    this.nix = createNixStub();
    this.discord = this.nix.discord;
    this.guild = Mockery.create('Guild');

    this.channel = Mockery.create('TextChannel', {
      guild: this.guild,
    });

    this.message = {
      content: 'Hello World!',
      member: Mockery.create('GuildMember'),
      guild: this.guild,
      channel: this.channel,
    };

    this.command = {
      name: "test",
      moduleName: 'core',
      args: [],
      run: sinon.fake(),
    };

    this.nix.listen().subscribe(
      () => {
        this.commandService = this.nix.getService('core', 'CommandService');
        sinon.stub(this.commandService, 'canSendMessage').returns(Rx.Observable.of(true));

        done();
      },
      (error) => done(error),
    );
  });

  afterEach(function (done) {
    if (this.nix.listening) {
      this.nix.shutdown(
        () => done(),
        (error) => done(error),
      );
    } else {
      done();
    }
  });

  it('runs basic commands', function (done) {
    this.message.content = '!test';
    this.nix.addCommand(this.command);

    this.discord.emit('message', this.message);
    this.nix.shutdown()
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

    this.nix.addCommand(this.command);

    this.discord.emit('message', this.message);
    this.nix.shutdown()
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

    this.nix.addCommand(this.command);

    this.discord.emit('message', this.message);
    this.nix.shutdown()
      .do(() => {
        expect(this.command.run).not.to.have.been.called;
        expect(this.channel.send).to.have.been.calledWith("I'm sorry, but I'm missing some information for that command:");
      })
      .subscribe(() => done(), (error) => done(error));
  });

  it('does not run commands that the user does not have permission to run', function (done) {
    this.message.content = '!test';

    this.command.permissions = ['test'];

    this.nix.addPermissionLevel('test');
    this.nix.addCommand(this.command);

    this.discord.emit('message', this.message);
    this.nix.shutdown()
      .do(() => {
        expect(this.command.run).not.to.have.been.called;
      })
      .subscribe(() => done(), (error) => done(error));
  });
});
