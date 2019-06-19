const ChaosDataMemory = require('chaos-data-memory');

class ChaosDataDummy extends ChaosDataMemory {
  constructor(chaos, config) {
    super(chaos, config);
    this.type = "dummy";
  }
}

module.exports = ChaosDataDummy;