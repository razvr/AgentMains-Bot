const createChaosStub = require('../test/create-chaos-stub');
const { tap, toArray } = require('rxjs/operators');

const EventManager = require('./event-manager');

describe('EventManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub({ logger: { level: 'silly' } });
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

  describe('#addEventListener', function () {
    beforeEach(function () {
      this.eventManager.registerEvent('test');
    });

    it('adds a handler', function () {
      const handler = sinon.fake();
      this.eventManager.addEventListener('test', handler);

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([handler]);
      expect(handlers.before).to.deep.equal([]);
      expect(handlers.after).to.deep.equal([]);
    });

    it('adds a before handler', function () {
      const handler = sinon.fake();
      this.eventManager.addEventListener('test:before', handler);

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([]);
      expect(handlers.before).to.deep.equal([handler]);
      expect(handlers.after).to.deep.equal([]);
    });

    it('adds an after handler', function () {
      const handler = sinon.fake();
      this.eventManager.addEventListener('test:after', handler);

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([]);
      expect(handlers.before).to.deep.equal([]);
      expect(handlers.after).to.deep.equal([handler]);
    });
  });

  describe('#triggerEvent', function () {
    beforeEach(function () {
      this.eventManager.registerEvent('test');
    });

    it('triggers handlers in order', function (done) {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();
      const payload = { foo: "bar" };

      this.eventManager.addEventListener('test:before', beforeHandler);
      this.eventManager.addEventListener('test', handler);
      this.eventManager.addEventListener('test:after', afterHandler);

      this.eventManager.triggerEvent('test', payload).pipe(
        toArray(),
        tap(() => expect(beforeHandler).to.have.been.called),
        tap(() => expect(handler).to.have.been.calledAfter(beforeHandler)),
        tap(() => expect(afterHandler).to.have.been.calledAfter(handler)),
      ).subscribe(() => {}, (error) => done(error), () => done());
    });
  });
});