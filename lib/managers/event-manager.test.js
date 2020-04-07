const createChaosStub = require('../test/create-chaos-stub');
const EventManager = require('./event-manager');

describe('EventManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.eventManager = new EventManager(this.chaos);
  });

  describe('#registerEvent', function () {
    it('registers an event', function () {
      this.eventManager.registerEvent('test');

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([]);
      expect(handlers.before).to.deep.equal([]);
      expect(handlers.after).to.deep.equal([]);
    });
  });

  describe('#on', function () {
    beforeEach(function () {
      this.eventManager.registerEvent('test');
    });

    it('treats event as case insensitive', function () {
      const handler = sinon.fake();
      this.eventManager.on('TEST', handler);

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([handler]);
    });

    it('adds a handler', function () {
      const handler = sinon.fake();
      this.eventManager.on('test', handler);

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([handler]);
      expect(handlers.before).to.deep.equal([]);
      expect(handlers.after).to.deep.equal([]);
    });

    it('adds a before handler', function () {
      const handler = sinon.fake();
      this.eventManager.on('test:before', handler);

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([]);
      expect(handlers.before).to.deep.equal([handler]);
      expect(handlers.after).to.deep.equal([]);
    });

    it('adds an after handler', function () {
      const handler = sinon.fake();
      this.eventManager.on('test:after', handler);

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([]);
      expect(handlers.before).to.deep.equal([]);
      expect(handlers.after).to.deep.equal([handler]);
    });
  });

  describe('#emit', function () {
    beforeEach(function () {
      this.eventManager.registerEvent('test');
    });

    it('emits when all handlers have completed', async function () {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.on('test:before', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        beforeHandler();
      });
      this.eventManager.on('test', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        handler();
      });
      this.eventManager.on('test:after', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        afterHandler();
      });

      await this.eventManager.emit('test');
      expect(beforeHandler).to.have.been.called;
      expect(handler).to.have.been.called;
      expect(afterHandler).to.have.been.called;
    });

    it('triggers case insensitive events', async function () {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.on('test:before', beforeHandler);
      this.eventManager.on('test', handler);
      this.eventManager.on('test:after', afterHandler);

      await this.eventManager.emit('TEST');
      expect(beforeHandler).to.have.been.called;
      expect(handler).to.have.been.called;
      expect(afterHandler).to.have.been.called;
    });

    it('triggers case insensitive handlers', async function () {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.on('TEST:BEFORE', beforeHandler);
      this.eventManager.on('TEST', handler);
      this.eventManager.on('TEST:AFTER', afterHandler);

      await this.eventManager.emit('test');
      expect(beforeHandler).to.have.been.called;
      expect(handler).to.have.been.called;
      expect(afterHandler).to.have.been.called;
    });

    it('triggers handlers once', async function () {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.on('test:before', beforeHandler);
      this.eventManager.on('test', handler);
      this.eventManager.on('test:after', afterHandler);

      await this.eventManager.emit('test');
      expect(beforeHandler).to.have.been.calledOnce;
      expect(handler).to.have.been.calledOnce;
      expect(afterHandler).to.have.been.calledOnce;
    });

    it('triggers before handlers', async function () {
      const handler = sinon.fake();
      const payload = { foo: "bar" };

      this.eventManager.on('test:before', handler);

      await this.eventManager.emit('test', payload);
      expect(handler).to.have.been.calledWith(payload);
    });

    it('triggers handlers', async function () {
      const handler = sinon.fake();
      const payload = { foo: "bar" };

      this.eventManager.on('test', handler);

      await this.eventManager.emit('test', payload);
      expect(handler).to.have.been.calledWith(payload);
    });

    it('triggers after handlers', async function () {
      const handler = sinon.fake();
      const payload = { foo: "bar" };

      this.eventManager.on('test:after', handler);

      await this.eventManager.emit('test', payload);
      expect(handler).to.have.been.calledWith(payload);
    });

    it('triggers handlers in order', async function () {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.on('test:before', beforeHandler);
      this.eventManager.on('test', handler);
      this.eventManager.on('test:after', afterHandler);

      await this.eventManager.emit('test');
      expect(beforeHandler).to.have.been.called;
      expect(handler).to.have.been.calledAfter(beforeHandler);
      expect(afterHandler).to.have.been.calledAfter(handler);
    });

    context("when an error occurs in an handler", function () {
      beforeEach(function () {
        this.eventManager.on('test:before', () => {
          throw new Error();
        });
      });

      it("stops later stages", async function () {
        const beforeHandler = sinon.fake();
        const handler = sinon.fake();
        const afterHandler = sinon.fake();

        this.eventManager.on('test:before', beforeHandler);
        this.eventManager.on('test', handler);
        this.eventManager.on('test:after', afterHandler);

        await this.eventManager.emit('test');
        expect(beforeHandler).not.to.have.been.called;
        expect(handler).not.to.have.been.called;
        expect(afterHandler).not.to.have.been.called;
      });

      it("lets Chaos handle the error", async function () {
        sinon.spy(this.chaos, 'handleError');
        await this.eventManager.emit('test');
        expect(this.chaos.handleError).to.have.been.calledOnce;
      });
    });
  });
});
