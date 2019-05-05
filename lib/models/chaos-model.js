class ChaosModel {
  constructor(chaos) {
    this._chaos = chaos;
  }

  get chaos() {
    return this._chaos;
  }
}

module.exports = ChaosModel;