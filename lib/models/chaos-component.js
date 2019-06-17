class ChaosComponent {
  constructor(chaos) {
    this._chaos = chaos;
  }

  get chaos() {
    return this._chaos;
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