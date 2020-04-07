const Response = require('./response');
const { MockMessage } = require("../test/mocks/discord.mocks");

describe('Response', function () {
  beforeEach(function () {
    this.message = new MockMessage({});
    this.response = new Response(this.message);
  });

  describe('constructor', function () {
    it('defaults the type to "message"', function () {
      this.response = new Response(this.message);
      expect(this.response.type).to.eq('message');
    });

    it('defaults the content to ""', function () {
      this.response = new Response(this.message);
      expect(this.response.content).to.eq('');
    });

    it('defaults embed to null', function () {
      this.response = new Response(this.message);
      expect(this.response._embed).to.be.null;
    });
  });

  describe('#send', function () {
    context('when response type is "none"', function () {
      beforeEach(function () {
        this.response.type = 'none';
      });

      it("does not send a response", async function () {
        this.message.reply = sinon.fake();
        this.message.channel.send = sinon.fake();
        this.message.author.send = sinon.fake();

        await this.response.send().toPromise();

        expect(this.message.reply).not.to.have.been.called;
        expect(this.message.channel.send).not.to.have.been.called;
        expect(this.message.author.send).not.to.have.been.called;
      });
    });

    context('when response type is "reply"', function () {
      beforeEach(function () {
        this.response.type = 'reply';
        this.message.reply = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
      });

      it("replies to the message", async function () {
        await this.response.send().toPromise();
        expect(this.message.reply).to.have.been.calledOnceWith(this.response.content);
      });

      it("returns an observable of the response from discord", async function () {
        let response = await this.response.send().toPromise();
        expect(response).to.eq("discordResponse");
      });
    });

    context('when response type is "message"', function () {
      beforeEach(function () {
        this.response.type = 'message';
        this.message.channel.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
      });

      it("sends a message to the channel", async function () {
        await this.response.send().toPromise();
        expect(this.message.channel.send).to.have.been.calledOnceWith(this.response.content);
      });

      it("returns an observable of the response from discord", async function () {
        let response = await this.response.send().toPromise();
        expect(response).to.eq("discordResponse");
      });
    });

    context('when response type is "embed"', function () {
      beforeEach(function () {
        this.response.type = 'embed';
        this.message.channel.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
      });

      it("sends an embed to the channel", async function () {
        await this.response.send().toPromise();
        expect(this.message.channel.send).to.have.been.calledOnceWith(
          this.response.content, { embed: this.response.embed },
        );
      });

      it("returns an observable of the response from discord", async function () {
        let response = await this.response.send().toPromise();
        expect(response).to.eq("discordResponse");
      });
    });

    context('when response type is "dm"', function () {
      beforeEach(function () {
        this.response.type = 'dm';
        this.message.author.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
      });

      it("sends a message to the author", async function () {
        await this.response.send().toPromise();
        expect(this.message.author.send).to.have.been.calledOnceWith(this.response.content);
      });

      it("returns an observable of the response from discord", async function () {
        let response = await this.response.send().toPromise();
        expect(response).to.eq("discordResponse");
      });
    });

    context('when an unknown response type is used', function () {
      beforeEach(function () {
        this.response.type = 'unknown';
      });

      it("returns an observable that throws an error", async function () {
        try {
          await this.response.send().toPromise();
        } catch (error) {
          expect(error).to.eq('Unknown response type unknown');
          return;
        }

        throw new Error("Expected an error to be thrown");
      });
    });

    context('when the shorthand is used', function () {
      context('when type is used in the shorthand', function () {
        beforeEach(function () {
          this.options = { type: 'reply' };
          this.message.reply = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
        });

        it('changes the response type', async function () {
          await this.response.send(this.options);
          expect(this.response.type).to.eq('reply');
        });

        it('sends the correct response', async function () {
          await this.response.send(this.options);
          expect(this.message.reply).to.have.been.calledOnceWith(this.response.content);
        });
      });

      context('when content is used in the shorthand', function () {
        beforeEach(function () {
          this.options = { content: 'message' };
          this.message.channel.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
        });

        it('changes the response content', async function () {
          await this.response.send(this.options);
          expect(this.response.content).to.eq('message');
        });

        it('sends the correct response', async function () {
          await this.response.send(this.options);
          expect(this.message.channel.send).to.have.been.calledOnceWith('message');
        });
      });

      context('when embed is used in the shorthand', function () {
        beforeEach(function () {
          this.embed = { title: "mock_embed" };
          this.options = { embed: this.embed };
          this.message.channel.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
        });

        it('changes the response embed', async function () {
          await this.response.send(this.options);
          expect(this.response.embed.title).to.eq("mock_embed");
        });

        it('changes the response type', async function () {
          await this.response.send(this.options);
          expect(this.response.type).to.eq('embed');
        });

        it('sends the correct response', async function () {
          await this.response.send(this.options);
          expect(this.message.channel.send).to.have.been.calledOnceWith(
            '', { embed: this.response.embed },
          );
        });
      });
    });
  });
});
