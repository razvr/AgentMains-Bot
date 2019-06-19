class ChaosComponent {
  constructor(chaos) {
    this._chaos = chaos;
  }

  get chaos() {
    return this._chaos;
  }

  /**
   * Alias for easy access to the chaos logger
   *
   * @returns {Logger}
   */
  get logger() {
    return this.chaos.logger;
  }

  validate() {
    return true;
  }
}

module.exports = ChaosComponent;