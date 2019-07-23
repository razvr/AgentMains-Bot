const { of } = require('rxjs');
const { tap, toArray, delay } = require('rxjs/operators');

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

  describe('#addEventListener', function () {
    beforeEach(function () {
      this.eventManager.registerEvent('test');
    });

    it('treats event as case insensitive', function () {
      const handler = sinon.fake();
      this.eventManager.addEventListener('TEST', handler);

      const handlers = this.eventManager.getEventHandlers('test');
      expect(handlers).to.deep.equal([handler]);
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

    it('emits when all handlers have completed', function (done) {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.addEventListener('test:before', () => of('').pipe(
        delay(100), tap(beforeHandler),
      ));
      this.eventManager.addEventListener('test', () => of('').pipe(
        delay(100), tap(handler),
      ));
      this.eventManager.addEventListener('test:after', () => of('').pipe(
        delay(100), tap(afterHandler),
      ));

      this.eventManager.triggerEvent('test').pipe(
        toArray(),
        tap((emitted) => expect(emitted).to.have.lengthOf(1)),
        tap(() => expect(beforeHandler).to.have.been.called),
        tap(() => expect(handler).to.have.been.called),
        tap(() => expect(afterHandler).to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('triggers case insensitive events', function (done) {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.addEventListener('test:before', beforeHandler);
      this.eventManager.addEventListener('test', handler);
      this.eventManager.addEventListener('test:after', afterHandler);

      this.eventManager.triggerEvent('TEST').pipe(
        toArray(),
        tap(() => expect(beforeHandler).to.have.been.calledOnce),
        tap(() => expect(handler).to.have.been.calledOnce),
        tap(() => expect(afterHandler).to.have.been.calledOnce),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('triggers case insensitive handlers', function (done) {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.addEventListener('TEST:BEFORE', beforeHandler);
      this.eventManager.addEventListener('TEST', handler);
      this.eventManager.addEventListener('TEST:AFTER', afterHandler);

      this.eventManager.triggerEvent('test').pipe(
        toArray(),
        tap(() => expect(beforeHandler).to.have.been.calledOnce),
        tap(() => expect(handler).to.have.been.calledOnce),
        tap(() => expect(afterHandler).to.have.been.calledOnce),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('triggers handlers once', function (done) {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.addEventListener('test:before', beforeHandler);
      this.eventManager.addEventListener('test', handler);
      this.eventManager.addEventListener('test:after', afterHandler);

      this.eventManager.triggerEvent('test').pipe(
        toArray(),
        tap(() => expect(beforeHandler).to.have.been.calledOnce),
        tap(() => expect(handler).to.have.been.calledOnce),
        tap(() => expect(afterHandler).to.have.been.calledOnce),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('triggers before handlers', function (done) {
      const handler = sinon.fake();
      const payload = { foo: "bar" };

      this.eventManager.addEventListener('test:before', handler);

      this.eventManager.triggerEvent('test', payload).pipe(
        toArray(),
        tap(() => expect(handler).to.have.been.calledWith(payload)),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('triggers handlers', function (done) {
      const handler = sinon.fake();
      const payload = { foo: "bar" };

      this.eventManager.addEventListener('test', handler);

      this.eventManager.triggerEvent('test', payload).pipe(
        toArray(),
        tap(() => expect(handler).to.have.been.calledWith(payload)),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('triggers after handlers', function (done) {
      const handler = sinon.fake();
      const payload = { foo: "bar" };

      this.eventManager.addEventListener('test:after', handler);

      this.eventManager.triggerEvent('test', payload).pipe(
        toArray(),
        tap(() => expect(handler).to.have.been.calledWith(payload)),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('triggers handlers in order', function (done) {
      const beforeHandler = sinon.fake();
      const handler = sinon.fake();
      const afterHandler = sinon.fake();

      this.eventManager.addEventListener('test:before', beforeHandler);
      this.eventManager.addEventListener('test', handler);
      this.eventManager.addEventListener('test:after', afterHandler);

      this.eventManager.triggerEvent('test').pipe(
        toArray(),
        tap(() => expect(beforeHandler).to.have.been.called),
        tap(() => expect(handler).to.have.been.calledAfter(beforeHandler)),
        tap(() => expect(afterHandler).to.have.been.calledAfter(handler)),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});