const Rx = require('rx');
const Nix = require('../../lib/nix-core');

describe('Nix', function () {
  beforeEach(function () {
    this.nix = new Nix({
      ownerUserId: "mock_ownerUserId",
      loginToken: "mock_loginToken",
    });
  });

  describe('#handleHook', function () {
    beforeEach(function () {
      this.nextCallback = sinon.fake();
    });

    context('when the hook return value is undefined', function () {
      beforeEach(function () {
        this.returnValue = undefined;
      });

      it('turns the value into an Observable', function (done) {
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(this.nextCallback, (error) => done(error), () => {
          expect(this.nextCallback).to.have.been.calledOnceWith('');
          done();
        });
      });
    });

    context('when the hook return value an observable', function () {
      beforeEach(function () {
        this.returnValue = Rx.Observable.of('response');
      });

      it('turns the value into an Observable', function (done) {
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(this.nextCallback, (error) => done(error), () => {
          expect(this.nextCallback).to.have.been.calledOnceWith('response');
          done();
        });
      });
    });

    context('when the hook return value is a promise', function () {
      beforeEach(function () {
        this.returnValue = new Promise((resolve) => resolve('response'));
      });

      it('turns the value into an Observable', function (done) {
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(this.nextCallback, (error) => done(error), () => {
          expect(this.nextCallback).to.have.been.calledOnceWith('response');
          done();
        });
      });
    });

    context('when the hook return value is an object', function () {
      beforeEach(function () {
        this.returnValue = { returned: true };
      });

      it('turns the value into an Observable', function (done) {
        let result$ = this.nix.handleHook(this.returnValue);
        expect(result$).to.be.an.instanceOf(Rx.Observable);

        result$.subscribe(this.nextCallback, (error) => done(error), () => {
          expect(this.nextCallback).to.have.been.calledOnceWith(this.returnValue);
          done();
        });
      });
    });
  });
});
