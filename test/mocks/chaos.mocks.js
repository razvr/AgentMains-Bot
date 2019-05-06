const Plugin = require('../../lib/models/plugin');
const Response = require('../../lib/models/response');
const Command = require('../../lib/models/command');
const CommandContext = require('../../lib/models/command-context');

class MockPlugin extends Plugin {
  constructor(options) {
    super({
      name: "testPlugin",
      ...options,
    });
  }
}

class MockResponse extends Response {
  constructor({ message, type, content, embed }) {
    super(message, type, content, embed);
  }
}

class MockCommand extends Command {
  constructor({ chaos, ...options }) {
    super(chaos, {
      name: 'testCommand',
      description: 'This is a test command',
      run: () => {},
      ...options,
    });
  }
}

class MockCommandContext extends CommandContext {
  constructor({chaos, message = "hello", command = null, args = [], flags = {} }) {
    if (!command) {
      command = new MockCommand({ chaos });
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
