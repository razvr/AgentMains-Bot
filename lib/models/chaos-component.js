class ChaosComponent {
  constructor(chaos) {
    this._chaos = chaos;
  }

  get chaos() {
    return this._chaos;
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
}

module.exports = ChaosComponent;