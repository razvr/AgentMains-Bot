class MockContext {
  get guild() {
    return this.message.guild;
  }

  get author() {
    return this.message.author;
  }

  get member() {
    return this.message.member;
  }

  get user() {
    return this.message.author;
  }

  get channel() {
    return this.message.channel;
  }

  constructor() {
    this.message = {
      guild: "mock_guild",
      author: "mock_author",
      member: "mock_member",
      channel: "mock_channel",
    };

    this.nix = "mock_nix";
    this.command = "mock_command";
    this.args = {};
    this.flags = {};
  }
}

module.exports = MockContext;
