class MockMessage {
  constructor() {
    this.guild = sinon.mock("guild");
    this.author = sinon.mock("author");
    this.member = sinon.mock("member");
    this.channel = sinon.mock("channel");

    this.reply = sinon.fake();
  }
}

module.exports = MockMessage;
