const Rx = require('rx');
const MockMessage = require("../../support/mock-message");
const Response = require('../../../lib/models/response');

describe('Response', function () {
  beforeEach(function () {
    this.message = new MockMessage();
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
    beforeEach(function () {
      this.nextCallback = sinon.fake();
    });

    context('when response type is "none"', function () {
      beforeEach(function () {
        this.response.type = 'none';
      });

      it("does not send a response", function () {
        this.message.reply = sinon.fake();
        this.message.channel.send = sinon.fake();
        this.message.author.send = sinon.fake();

        this.response.send();

        expect(this.message.reply).not.to.have.been.called;
        expect(this.message.channel.send).not.to.have.been.called;
        expect(this.message.author.send).not.to.have.been.called;
      });

      it("returns an empty observable", function (done) {
        let result$ = this.response.send();
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(
          this.nextCallback,
          (error) => done(error),
          () => {
            expect(this.nextCallback).not.to.have.been.called;
            done();
          },
        );
      });
    });

    context('when response type is "reply"', function () {
      beforeEach(function () {
        this.response.type = 'reply';
        this.message.reply = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
      });

      it("replies to the message", function () {
        this.response.send();
        expect(this.message.reply).to.have.been.calledOnceWith(this.response.content);
      });

      it("returns an observable of the response from discord", function (done) {
        let result$ = this.response.send();
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(
          this.nextCallback,
          (error) => done(error),
          () => {
            expect(this.nextCallback).to.have.been.calledOnceWith("discordResponse");
            done();
          },
        );
      });
    });

    context('when response type is "message"', function () {
      beforeEach(function () {
        this.response.type = 'message';
        this.message.channel.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
      });

      it("sends a message to the channel", function () {
        this.response.send();
        expect(this.message.channel.send).to.have.been.calledOnceWith(this.response.content);
      });

      it("returns an observable of the response from discord", function (done) {
        let items = 0;

        let result$ = this.response.send();
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(
          this.nextCallback,
          (error) => done(error),
          () => {
            expect(this.nextCallback).to.have.been.calledOnceWith("discordResponse");
            done();
          },
        );
      });
    });

    context('when response type is "embed"', function () {
      beforeEach(function () {
        this.response.type = 'embed';
        this.message.channel.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
      });

      it("sends an embed to the channel", function () {
        this.response.send();
        expect(this.message.channel.send).to.have.been.calledOnceWith(
          this.response.content, {embed: this.response.embed},
        );
      });

      it("returns an observable of the response from discord", function (done) {
        let result$ = this.response.send();
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(
          this.nextCallback,
          (error) => done(error),
          () => {
            expect(this.nextCallback).to.have.been.calledOnceWith("discordResponse");
            done();
          },
        );
      });
    });

    context('when response type is "dm"', function () {
      beforeEach(function () {
        this.response.type = 'dm';
        this.message.author.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
      });

      it("sends a message to the author", function () {
        this.response.send();
        expect(this.message.author.send).to.have.been.calledOnceWith(this.response.content);
      });

      it("returns an observable of the response from discord", function (done) {
        let result$ = this.response.send();
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(
          this.nextCallback,
          (error) => done(error),
          () => {
            expect(this.nextCallback).to.have.been.calledOnceWith("discordResponse");
            done();
          },
        );
      });
    });

    context('when an unknown response type is used', function () {
      beforeEach(function () {
        this.response.type = 'unknown';
      });

      it("returns an observable that throws an error", function (done) {
        let result$ = this.response.send();
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(
          this.nextCallback,
          (error) => {
            expect(error).to.eq('Unknown response type unknown');
            done();
          },
          () => {
            done("error callback was not called");
          },
        );
      });
    });

    context('when the shorthand is used', function () {
      context('when type is used in the shorthand', function () {
        beforeEach(function () {
          this.options = {type: 'reply'};
          this.message.reply = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
        });

        it('changes the response type', function () {
          this.response.send(this.options);
          expect(this.response.type).to.eq('reply');
        });

        it('sends the correct response', function () {
          this.response.send(this.options);
          expect(this.message.reply).to.have.been.calledOnceWith(this.response.content);
        });
      });

      context('when content is used in the shorthand', function () {
        beforeEach(function () {
          this.options = {content: 'message'};
          this.message.channel.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
        });

        it('changes the response content', function () {
          this.response.send(this.options);
          expect(this.response.content).to.eq('message');
        });

        it('sends the correct response', function () {
          this.response.send(this.options);
          expect(this.message.channel.send).to.have.been.calledOnceWith('message');
        });
      });

      context('when embed is used in the shorthand', function () {
        beforeEach(function () {
          this.embed = {title: "mock_embed"};
          this.options = {embed: this.embed};
          this.message.channel.send = sinon.fake.returns(new Promise((resolve) => resolve("discordResponse")));
        });

        it('changes the response embed', function () {
          this.response.send(this.options);
          expect(this.response.embed.title).to.eq("mock_embed");
        });

        it('changes the response type', function () {
          this.response.send(this.options);
          expect(this.response.type).to.eq('embed');
        });

        it('sends the correct response', function () {
          this.response.send(this.options);
          expect(this.message.channel.send).to.have.been.calledOnceWith(
            '', {embed: this.response.embed},
          );
        });
      });
    });
  });
});
