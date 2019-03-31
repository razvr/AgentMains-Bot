let Rx = require('rx');

module.exports = function (chai) {
  let Assertion = chai.Assertion;

  Assertion.addProperty('observable', toBeObservable);
  Assertion.addMethod('emitLength', toEmitLength);
  Assertion.addMethod('emit', toEmit);
  Assertion.addMethod('close', toClose);
  Assertion.addMethod('complete', toClose);

  Assertion.overwriteMethod('throw', function (_super) {
    return function (errorLike, errMatcher) {
      if (this._obj instanceof Rx.Observable) {
        return toThrow.apply(this, arguments);
      } else {
        return _super.apply(this, arguments);
      }
    };
  });

  function toBeObservable() {
    new Assertion(this._obj).to.be.an.instanceOf(Rx.Observable);
  }

  function toEmitLength(length) {
    new Assertion(this._obj).to.be.observable;
    this._obj = Rx.Observable.merge(
      this._obj
        .count(() => true)
        .map((emittedLength) => new Assertion(emittedLength).to.eq(length))
        .ignoreElements(),
      this._obj,
    );
  }

  function toEmit(items) {
    new Assertion(this._obj).to.be.observable;
    this._obj = Rx.Observable.merge(
      this._obj
        .toArray()
        .map((emittedItems) => new Assertion(emittedItems).to.deep.equal(items))
        .ignoreElements(),
      this._obj,
    );
  }

  function toThrow(errorLike, errMatcher) {
    new Assertion(this._obj).to.be.observable;

    this._obj = this._obj
      .toArray()
      .map(() => false)
      .catch((error) => {
        new Assertion(error).to.be.an.instanceOf(errorLike);

        if (errMatcher) {
          if (typeof errMatcher === "string") {
            new Assertion(error.message).to.eq(errMatcher);
          } else {
            Object.entries(errMatcher).forEach(([property, expected]) => {
              new Assertion(error[property]).to.eq(expected);
            });
          }
        }

        return Rx.Observable.of(true);
      })
      .do((caught) => {
        if (!caught) {
          throw new Error('expected to throw an error, but none was thrown.');
        }
      });
  }

  function toClose(done) {
    this._obj.subscribe(
      () => {},
      (error) => done(error),
      () => done(),
    );
  }
};
