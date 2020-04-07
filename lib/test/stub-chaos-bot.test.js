const { Observable } = require('rxjs');
const { tap, map } = require('rxjs/operators');

const ChaosCore = require('../chaos-core');
const stubChaosBot = require("./stub-chaos-bot");
const { MockUser, MockClientUser } = require("./mocks/discord.mocks");

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

  it('adds #testCommand', function () {
    expect(this.chaos.testCommand).to.be.a('function');
  });

  it('adds #testConfigAction', function () {
    expect(this.chaos.testConfigAction).to.be.a('function');
  });

  it('stubs the bot owner', function () {
    expect(this.chaos.owner).to.be.an.instanceOf(MockUser);
  });

  it('stubs discord#login', function (done) {
    this.chaos.discord.login()
      .then(() => expect(this.chaos.discord.user instanceof MockClientUser).to.be.true)
      .then(() => done())
      .catch((error) => done(error));
  });

  describe('#testCommand', function () {
    beforeEach(function () {
      this.chaos.addPlugin({
        name: 'test',
        commands: [
          { name: "test", run: () => {} },
        ],
      });

      this.test$ = this.chaos.testCommand({
        pluginName: 'test',
        commandName: 'test',
      });
    });

    it('returns an Observable', function () {
      expect(this.test$).to.be.an.instanceOf(Observable);
    });

    it('allows for setting args', function () {
      expect(this.test$.args).to.be.an('object');
    });

    it('allows for setting flags', function () {
      expect(this.test$.flags).to.be.an('object');
    });

    it('does not call the command till subscribed', function (done) {
      const command = this.chaos.getCommand('test');
      sinon.spy(command, 'run');

      this.test$ = this.chaos.testCommand({
        pluginName: 'test',
        commandName: 'test',
      });

      expect(command.run).not.to.have.been.called;

      this.test$.pipe(
        tap(() => expect(command.run).to.have.been.calledOnce),
      ).subscribe(() => done(), (error) => done(error));
    });

    context('when the command has permissions', function () {
      beforeEach(function () {
        const command = this.chaos.getCommand('test');
        command.permissions = ["admin"];
      });

      context('when the member does not have permission', function () {
        it('does not call the command', function (done) {
          const command = this.chaos.getCommand('test');
          sinon.spy(command, 'run');

          this.test$.pipe(
            tap(() => expect(command.run).not.to.have.been.called),
          ).subscribe(() => done(), (error) => done(error));
        });
      });

      context('when the member does have permission', function () {
        beforeEach(async function () {
          await this.chaos.getService('core', 'PermissionsService')
            .addUser(this.test$.message.guild, 'admin', this.test$.message.member)
            .toPromise();
        });

        it('calls the command', function (done) {
          const command = this.chaos.getCommand('test');
          sinon.spy(command, 'run');

          this.test$.pipe(
            tap(() => expect(command.run).to.have.been.called),
          ).subscribe(() => done(), (error) => done(error));
        });
      });
    });

    context('when no message is passed', function () {
      it('generates a mock message', function () {
        const message = this.test$.message;
        expect(message).not.to.be.undefined;
        expect(typeof message.reply).to.eq("function");

        expect(message.guild).not.to.be.undefined;

        expect(message.channel).not.to.be.undefined;
        expect(typeof message.channel.send).to.eq("function");

        expect(message.member).not.to.be.undefined;

        expect(message.author).not.to.be.undefined;
        expect(typeof message.author.send).to.eq("function");

        expect(message.member.user).to.eq(message.author);
      });
    });

    context('when a message is passed', function () {
      it('does not replace the message', function () {
        const message = {};

        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message,
        });

        expect(this.test$.message).to.eq(message);
      });

      it('adds a guild to the message if not defined', function () {
        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message: {},
        });

        expect(this.test$.message.guild).not.to.be.undefined;

        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message: { guild: "guild" },
        });

        expect(this.test$.message.guild).to.eq("guild");
      });

      it('adds a channel to the message if not defined', function () {
        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message: {},
        });

        expect(this.test$.message.channel).not.to.be.undefined;

        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message: { channel: "channel" },
        });

        expect(this.test$.message.channel).to.eq("channel");
      });

      it('adds a member to the message if not defined', function () {
        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message: {},
        });

        expect(this.test$.message.channel).not.to.be.undefined;

        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message: { member: "member" },
        });

        expect(this.test$.message.member).to.eq("member");
      });

      it('adds an author to the message if not defined', function () {
        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message: {},
        });

        expect(this.test$.message.channel).not.to.be.undefined;

        this.test$ = this.chaos.testCommand({
          pluginName: 'test',
          commandName: 'test',
          message: { author: "author" },
        });

        expect(this.test$.message.author).to.eq("author");
      });
    });

    context('when there are missing args', function () {
      beforeEach(function () {
        const command = this.chaos.getCommand('test');
        command.args = [
          { name: 'arg1', required: true },
        ];
      });

      it('does not call the command', function (done) {
        const command = this.chaos.getCommand('test');
        sinon.spy(command, 'run');

        this.test$.pipe(
          tap(() => expect(command.run).not.to.have.been.called),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when arguments are set', function () {
      it('calls the command with the args', function (done) {
        const command = this.chaos.getCommand('test');
        sinon.spy(command, 'run');

        this.test$.args.arg1 = "value1";
        this.test$.args.arg2 = "value2";

        this.test$.pipe(
          tap(() => expect(command.run).to.have.been.called),
          map(() => command.run.args[0][0]),
          tap((context) => expect(context).to.containSubset({
            args: { arg1: 'value1', arg2: 'value2' },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when flags are set', function () {
      it('calls the command with the flags', function (done) {
        const command = this.chaos.getCommand('test');
        sinon.spy(command, 'run');

        this.test$.flags.flag1 = true;
        this.test$.flags.flag2 = true;

        this.test$.pipe(
          tap(() => expect(command.run).to.have.been.called),
          map(() => command.run.args[0][0]),
          tap((context) => expect(context).to.containSubset({
            flags: { flag1: true, flag2: true },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });

  describe('#testConfigAction', function () {
    beforeEach(function () {
      this.chaos.addPlugin({
        name: 'test',
        configActions: [
          { name: "test", run: () => {} },
        ],
      });

      this.test$ = this.chaos.testConfigAction({
        pluginName: 'test',
        actionName: 'test',
      });
    });

    it('returns an Observable', function () {
      expect(this.test$).to.be.an.instanceOf(Observable);
    });

    it('allows for setting args', function () {
      expect(this.test$.args).to.be.an('object');
    });

    it('does not call the command till subscribed', function (done) {
      const action = this.chaos.getConfigAction('test', 'test');
      sinon.spy(action, 'run');

      this.test$ = this.chaos.testConfigAction({
        pluginName: 'test',
        actionName: 'test',
      });

      expect(action.run).not.to.have.been.called;

      this.test$.pipe(
        tap(() => expect(action.run).to.have.been.calledOnce),
      ).subscribe(() => done(), (error) => done(error));
    });

    context('when no message is passed', function () {
      it('generates a mock message', function () {
        const message = this.test$.message;
        expect(message).not.to.be.undefined;
        expect(typeof message.reply).to.eq("function");

        expect(message.guild).not.to.be.undefined;

        expect(message.channel).not.to.be.undefined;
        expect(typeof message.channel.send).to.eq("function");

        expect(message.member).not.to.be.undefined;

        expect(message.author).not.to.be.undefined;
        expect(typeof message.author.send).to.eq("function");

        expect(message.member.user).to.eq(message.author);
      });
    });

    context('when a message is passed', function () {
      it('does not replace the message', function () {
        const message = {};

        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message,
        });

        expect(this.test$.message).to.eq(message);
      });

      it('adds a guild to the message if not defined', function () {
        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message: {},
        });

        expect(this.test$.message.guild).not.to.be.undefined;

        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message: { guild: "guild" },
        });

        expect(this.test$.message.guild).to.eq("guild");
      });

      it('adds a channel to the message if not defined', function () {
        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message: {},
        });

        expect(this.test$.message.channel).not.to.be.undefined;

        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message: { channel: "channel" },
        });

        expect(this.test$.message.channel).to.eq("channel");
      });

      it('adds a member to the message if not defined', function () {
        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message: {},
        });

        expect(this.test$.message.channel).not.to.be.undefined;

        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message: { member: "member" },
        });

        expect(this.test$.message.member).to.eq("member");
      });

      it('adds an author to the message if not defined', function () {
        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message: {},
        });

        expect(this.test$.message.channel).not.to.be.undefined;

        this.test$ = this.chaos.testConfigAction({
          pluginName: 'test',
          actionName: 'test',
          message: { author: "author" },
        });

        expect(this.test$.message.author).to.eq("author");
      });
    });

    context('when arguments are set', function () {
      it('calls the action with the args', function (done) {
        const action = this.chaos.getConfigAction('test', 'test');
        sinon.spy(action, 'run');

        this.test$.args.arg1 = "value1";
        this.test$.args.arg2 = "value2";

        this.test$.pipe(
          tap(() => expect(action.run).to.have.been.called),
          map(() => action.run.args[0][0]),
          tap((context) => expect(context).to.containSubset({
            args: {
              arg1: "value1",
              arg2: "value2",
            },
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
