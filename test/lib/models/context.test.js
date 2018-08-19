const MockNix = require("../../support/mock-nix");
const MockMessage = require("../../support/mock-message");
const MockCommand = require("../../support/mock-command");
const Context = require('../../../lib/models/context');

describe('Context', function () {
  beforeEach(function () {
    this.message = new MockMessage();
    this.nix = new MockNix();
    this.command = new MockCommand();
    this.params = {
      args: {},
      flags: {},
    };

    this.context = new Context(this.message, this.nix, this.command, this.params);
  });

  describe('constructor', function () {
    it('assigns attributes', function () {
      expect(this.context.message).to.eq(this.message);
      expect(this.context.nix).to.eq(this.nix);
      expect(this.context.command).to.eq(this.command);
      expect(this.context.args).to.eq(this.params.args);
      expect(this.context.flags).to.eq(this.params.flags);
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

  describe(".user", function() {
    context("when the member is unknown", function () {
      beforeEach(function () {
        this.message.member = null;
      });

      it('returns the author of the message', function () {
        expect(this.context.author).to.eq(this.message.author);
      });
    });

    context("when the member is known", function () {
      beforeEach(function () {
        this.message.member = 'member';
      });

      it('returns the member of the message', function () {
        expect(this.context.member).to.eq(this.message.member);
      });
    });
  });

  describe(".channel", function () {
    it('returns the channel of the message', function () {
      expect(this.context.channel).to.eq(this.message.channel);
    });
  });
});
