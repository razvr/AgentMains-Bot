const createChaosStub = require('../create-chaos-stub');
const Plugin = require('../../lib/models/plugin');
const Response = require('../../lib/models/response');
const Command = require('../../lib/models/command');
const CommandContext = require('../../lib/models/command-context');
const { MockMessage } = require("./discord.mocks");

class MockPlugin extends Plugin {
  constructor(options) {
    super({
      name: "testPlugin",
      ...options,
    });
  }
}

class MockResponse extends Response {
  constructor({ chaos, message, type, content, embed }) {
    if (!chaos) {
      chaos = createChaosStub();
    }

    if (!message) {
      message = new MockMessage({
        client: chaos.discord,
      });
    }

    super(message, type, content, embed);
  }
}

class MockCommand extends Command {
  constructor({ chaos, ...options }) {
    if (!chaos) {
      chaos = createChaosStub();
    }

    super(chaos, {
      name: 'testCommand',
      description: 'This is a test command',
      run: () => {},
      ...options,
    });
  }
}

class MockCommandContext extends CommandContext {
  constructor({ chaos, message, command, args = {}, flags = {} }) {
    if (!chaos) {
      chaos = createChaosStub();
    }

    if (!command) {
      command = new MockCommand({
        chaos,
      });
    }

    if (!message) {
      message = new MockMessage({
        client: chaos.discord,
      });
    }

    super(message, command, args, flags);
  }
}

module.exports = {
  MockPlugin,
  MockResponse,
  MockCommand,
  MockCommandContext,
};
