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
   * Hook callback for when ChaosCore is starting to listen to discord events. Called once per boot.
   *
   * @returns {*}
   */
  onListen() {}

  /**
   * Hook callback for when ChaosCore joins a new guild. Called once for each guild that ChaosCore has joined.
   *
   * @param guild {Guild} The guild that ChaosCore has joined.
   * @returns {*}
   */
  onJoinGuild() {}


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