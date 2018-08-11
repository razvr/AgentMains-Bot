const Rx = require('rx');

const Utilities = {
  handleHook(hookReturnValue) {
    if (typeof hookReturnValue === 'undefined') {
      return Rx.Observable.of('');
    }
    if (hookReturnValue instanceof Rx.Observable) {
      return hookReturnValue;
    }
    if (typeof hookReturnValue.then === 'function') {
      return Rx.Observable.fromPromise(hookReturnValue);
    }
    return Rx.Observable.of('');
  },
};

module.exports = Utilities;
