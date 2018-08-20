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

      it('turns the value into an Observable', function () {
        let result$ = this.nix.handleHook(this.returnValue);
      });
    });

    context('when the hook return value an observable', function () {
      beforeEach(function () {
        this.returnValue = Rx.Observable.of('');
      });

      it('turns the value into an Observable', function () {
        let result$ = this.nix.handleHook(this.returnValue);
      });
    });

    context('when the hook return value is a promise', function () {
      beforeEach(function () {
        this.returnValue = new Promise((resolve) => resolve(''));
      });

      it('turns the value into an Observable', function () {
        let result$ = this.nix.handleHook(this.returnValue);
      });
    });

    context('when the hook return value is an object', function () {
      beforeEach(function () {
        this.returnValue = {returned: true};
      });

      it('turns the value into an Observable', function () {
        let result$ = this.nix.handleHook(this.returnValue);
      });
    });
  });
});
