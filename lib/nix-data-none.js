const Rx = require('rx');

class NixDataNone {
  /**
   *
   * @param config
   */
  constructor(config) {}

  /**
   *
   * @param type
   * @param id
   *
   * @return {Rx.Observable}
   */
  getData(type, id) {
    return Rx.Observable.just('');
  }

  /**
   *
   * @param type
   * @param id
   * @param data
   *
   * @return {Rx.Observable}
   */
  setData(type, id, data) {
    return Rx.Observable.just('');
  }
}

module.exports = NixDataNone;
