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

  /**
   * Hook callback for when the plugin this component belongs to is enabled in a guild.
   *
   * @param guild {Guild} The guild that ChaosCore has joined.
   * @returns {*}
   */
  onEnabled() {}


  /**
   * Hook callback for when the plugin this component belongs to is disabled in a guild.
   *
   * @param guild {Guild} The guild that ChaosCore has joined.
   * @returns {*}
   */
  onDisabled() {}
}

module.exports = ChaosComponent;