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

  /**
   * Alias for easy access to chaos strings
   *
   * @returns {Logger}
   */
  get strings() {
    return this.chaos.strings;
  }

  validate() {
    return true;
  }
}

module.exports = ChaosComponent;
