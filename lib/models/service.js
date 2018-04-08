class Service {
  constructor(nix) {
    this._nix = nix;
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
   * Gets the instance of Nix that the service has been attached to.
   *
   * @returns {*}
   */
  get nix() {
    return this._nix;
  }

  /**
   * Hook callback for when Nix is configuring the services. All Services are now accessible
   * through `this.nix.getService()`.
   *
   * @param config {NixConfig} The configuration settings for Nix.
   * @returns {*}
   */
  configureService(config) {
    return true;
  }

  /**
   * Hook callback for when Nix is starting to listen to discord events. Called once per boot.
   *
   * @returns {*}
   */
  onNixListen() {
    return true;
  }

  /**
   * Hook callback for when Nix joins a new guild. Called once for each guild that Nix has joined.
   *
   * @param guild {Guild} The guild that Nix has joined.
   * @returns {*}
   */
  onNixJoinGuild(guild) {
    return true;
  }
}

module.exports = Service;
