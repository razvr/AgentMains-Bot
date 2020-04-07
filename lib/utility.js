module.exports = {
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
