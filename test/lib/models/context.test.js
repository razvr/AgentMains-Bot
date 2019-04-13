const Context = require('../../../lib/models/command-context');
const createChaosStub = require('../../support/create-chaos-stub');
const mocks = require('../../mocks');

describe('Context', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.message = mocks.discord.build("Message");
    this.context = mocks.chaos.create("Command");
    this.args = {};
    this.flags = {};

    this.context = new Context(
      this.chaos,
      this.message,
      this.command,
      this.args,
      this.flags,
    );
  });

  describe('constructor', function () {
    it('assigns attributes', function () {
      expect(this.context.message).to.eq(this.message);
      expect(this.context.chaos).to.eq(this.chaos);
      expect(this.context.command).to.eq(this.command);
      expect(this.context.args).to.eq(this.args);
      expect(this.context.flags).to.eq(this.flags);
    });
  });

  describe(".guild", function() {
    it('returns the guild of the message', function () {
      expect(this.context.guild).to.eq(this.message.guild);
    });
  });

  describe(".author", function() {
    it('returns the author of the message', function () {
      expect(this.context.author).to.eq(this.message.author);
    });
  });

  describe(".member", function() {
    it('returns the member of the message', function () {
      expect(this.context.member).to.eq(this.message.member);
    });
  });

  describe(".channel", function () {
    it('returns the channel of the message', function () {
      expect(this.context.channel).to.eq(this.message.channel);
    });
  });
});
