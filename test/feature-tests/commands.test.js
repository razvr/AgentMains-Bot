const { from } = require('rxjs');

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

    this.testMessage = (message) => {
      const nextResponse = new Promise((resolve) => {
        this.chaos.on('chaos.response', (response) => resolve(response));
        this.chaos.discord.emit('message', message);
      });
      return from(nextResponse);
    };

    this.commandService = this.chaos.getService('core', 'CommandService');
    this.pluginService = this.chaos.getService('core', 'pluginService');
    sinon.stub(this.commandService, 'canSendMessage').returns(true);

    this.chaos.addPlugin(this.plugin);

    await this.chaos.listen();
    await this.pluginService.enablePlugin(this.message.guild.id, this.plugin.name)
      .toPromise();
  });

  afterEach(async function () {
    if (this.chaos.listening) {
      await this.chaos.shutdown();
    }
  });

  it('runs basic commands', async function () {
    this.message.content = '!test';
    this.chaos.addCommand(this.plugin.name, this.command);

    await this.testMessage(this.message).toPromise();
    expect(this.command.run).to.have.been.called;
  });

  it('runs commands with arguments', async function () {
    this.message.content = '!test value1 value2';
    this.command.args = [
      { name: 'normal' },
      { name: 'required', required: true },
      { name: 'optional' },
      { name: 'default', default: 'value4' },
    ];

    this.chaos.addCommand(this.plugin.name, this.command);

    await this.testMessage(this.message).toPromise();
    expect(this.command.run).to.have.been.calledWith(sinon.match({
      args: {
        normal: 'value1',
        required: 'value2',
        optional: undefined,
        default: 'value4',
      },
    }));
  });

  it('returns a help message when a command is missing required arguments', async function () {
    this.message.content = '!test value1';
    this.message.channel.send = sinon.fake.resolves(true);
    this.command.args = [
      { name: 'param1' },
      { name: 'param2', required: true },
    ];

    this.chaos.addCommand(this.plugin.name, this.command);

    await this.testMessage(this.message).toPromise();
    expect(this.command.run).not.to.have.been.called;
    expect(this.message.channel.send).to.have.been.calledWith(
      "I'm sorry, but I'm missing some information for that command:",
    );
  });

  it('does not run commands that the user does not have permission to run', async function () {
    this.message.content = '!test';

    this.command.permissions = ['test'];
    this.chaos.addPermissionLevel('test');
    this.chaos.addCommand(this.plugin.name, this.command);

    await this.testMessage(this.message).toPromise();
    expect(this.command.run).not.to.have.been.called;
  });

  it('does not run commands that part of disabled plugins', async function () {
    this.message.content = '!test';
    this.chaos.addCommand(this.plugin.name, this.command);

    await this.pluginService.disablePlugin(this.message.guild.id, this.plugin.name).toPromise();
    await this.testMessage(this.message).toPromise();
    expect(this.command.run).not.to.have.been.called;
  });

  it('does not run commands that are explicitly disabled', async function () {
    this.message.content = '!test';
    this.chaos.addCommand(this.plugin.name, this.command);

    await this.commandService.disableCommand(this.message.guild.id, this.command.name);
    await this.testMessage(this.message);
    expect(this.command.run).not.to.have.been.called;
  });

  it('runs commands that are not explicitly disabled', async function () {
    this.message.content = '!test';
    this.chaos.addCommand(this.plugin.name, this.command);

    await this.testMessage(this.message).toPromise();
    expect(this.command.run).to.have.been.called;
  });

  context('when a command throws an error', function () {
    beforeEach(function () {
      this.error = new Error("ERROR!");
      this.message.content = '!test';
      this.command.run = sinon.fake(() => { throw this.error; });
      this.chaos.addCommand(this.plugin.name, this.command);
    });

    it('it gives an error message to the user', async function () {
      let response = await this.testMessage(this.message).toPromise();
      expect(response.replies).to.have.length(1);
      expect(response.replies[0].content)
        .to.include("I'm sorry, but there was an unexpected problem");
    });

    it('it triggers handleError', async function () {
      sinon.spy(this.chaos, 'handleError');
      await this.testMessage(this.message).toPromise();
      expect(this.chaos.handleError).to.have.been.calledWith(this.error);
    });
  });
});
