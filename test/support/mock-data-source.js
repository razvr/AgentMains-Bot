const Rx = require('rx');

class MockDataSource {
  constructor() {
    this.type = "Mock";
    this.data = {};
  }

  getData(type, id, keyword) {
    let dataKey = [type, id, keyword].join(':');
    return Rx.Observable.of(this.data[dataKey]);
  }

  setData(type, id, keyword, data) {
    let dataKey = [type, id, keyword].join(':');
    this.data[dataKey] = data;
    return Rx.Observable.of(this.data[dataKey]);
  }
}

module.exports = MockDataSource;
