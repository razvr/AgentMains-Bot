const Rx = require('rx');

module.exports = {
  toObservable: (hookReturnValue) => {
    let stream$;

    if (typeof hookReturnValue === 'undefined') {
      stream$ = Rx.Observable.of('');
    } else if (hookReturnValue instanceof Rx.Observable) {
      stream$ = hookReturnValue;
    } else if (typeof hookReturnValue.then === 'function') {
      stream$ = Rx.Observable.fromPromise(hookReturnValue);
    } else {
      stream$ = Rx.Observable.of(hookReturnValue);
    }

    return stream$.defaultIfEmpty('');
  },
};
