class Mockery {
  constructor() {
    this._factories = {};
  }

  define(name, defaultProps={}, options={}) {
    if (!name) {
      throw new ArgumentError("Name is required");
    }

    options = {
      name,
      defaultProps,
      builder: (props) => props,
      ...options,
    };

    this._factories[name] = options;
  }

  create(name, props={}) {
    let factory = this._factories[name];
    if (!factory) { throw new Error(`Unknown factory ${name}`); }

    props = {...props}; //clone the props array

    Object.entries(factory.defaultProps).forEach(([propName, defaultValue]) => {
      if (typeof props[propName] === "undefined") {
        if (defaultValue instanceof Sequence) {
          props[propName] = defaultValue.next(props);
        } else {
          props[propName] = defaultValue;
        }
      }
    });

    return factory.builder(props);
  }

  seq(next) {
    return new Sequence(next);
  }
}

class Sequence {
  constructor(sequenceFn) {
    this.index = 0;
    this.sequenceFn = sequenceFn;
  }

  next(props) {
    return this.sequenceFn(this.index, props);
  }
}

module.exports = new Mockery();
