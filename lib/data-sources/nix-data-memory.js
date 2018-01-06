const Rx = require('rx');

class NixDataMemory {
  /**
   *
   * @param config
   */
  constructor(nix, config) {
    this.type = "Memory";
    this.data = {};
  }

  /**
   *
   * @param type
   * @param id
   * @param keyword
   *
   * @return {Rx.Observable}
   */
  getData(type, id, keyword) {
    let typeData = this.data[type];
    if (!typeData) {
      typeData = {};
      this.data[type] = typeData;
    }

    let instanceData = typeData[id];
    if (!instanceData) {
      instanceData = {};
      typeData[id] = instanceData;
    }

    return Rx.Observable.just(instanceData[keyword]);
  }

  /**
   *
   * @param type
   * @param id
   * @param keyword
   * @param data
   *
   * @return {Rx.Observable}
   */
  setData(type, id, keyword, data) {
    let typeData = this.data[type];
    if (!typeData) {
      typeData = {};
      this.data[type] = typeData;
    }

    let instanceData = typeData[id];
    if (!instanceData) {
      instanceData = {};
      this.typeData[id] = instanceData;
    }

    instanceData[keyword] = data;

    return Rx.Observable.just(instanceData[keyword]);
  }
}

module.exports = NixDataMemory;
