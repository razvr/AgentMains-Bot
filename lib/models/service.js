const Rx = require('rx');

class Service {
  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  constructor(chaos) {
    this._chaos = chaos;
  }

  /**
   * Get the name of this service. Used when retrieving the service via nix.getService();
   * Defaults to the name of the class.
   *
   * @returns {*}
   */
  get name() {
    return this.constructor.name;
  }

  /**
   * Gets the instance of ChaosCore that the service has been attached to.
   *
   * @returns {*}
   */
  get chaos() {
    return this._chaos;
  }

  /**
   * Hook callback for when Nix is configuring the services. All Services are now accessible
   * through `this.nix.getService()`.
   *
   * @param config {ChaosConfig} The configuration settings for Nix.
   * @returns {*}
   */
  configureService(config) {}

  /**
   * Hook callback for when Nix is starting to listen to discord events. Called once per boot.
   *
   * @returns {*}
   */
  onListen() {}

  /**
   * Hook callback for when Nix joins a new guild. Called once for each guild that Nix has joined.
   *
   * @param guild {Guild} The guild that Nix has joined.
   * @returns {*}
   */
  onJoinGuild(guild) {}
}

module.exports = Service;
