const { of, from, Observable } = require('rxjs');
const { defaultIfEmpty } = require('rxjs/operators');

module.exports = {
  toObservable: (hookReturnValue) => {
    let stream$;

    if (typeof hookReturnValue === 'undefined') {
      stream$ = of('');
    } else if (hookReturnValue instanceof Observable) {
      stream$ = hookReturnValue;
    } else if (typeof hookReturnValue.then === 'function') {
      stream$ = from(hookReturnValue);
    } else {
      stream$ = of(hookReturnValue);
    }

    return stream$.pipe(defaultIfEmpty(''));
  },

  asPromise: (object) => {
    if (typeof object === 'undefined') {
      return Promise.resolve();
    } else if (object instanceof Promise) {
      return object;
    } else if (typeof object.toPromise === 'function') {
      return object.toPromise();
    } else {
      return Promise.resolve(object);
    }
  },
};
