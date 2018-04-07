class Service {
  constructor(nix, config) {
    this._nix = nix;
  }

  /**
   * Get the name of this service. Used when retrieving the service via nix.getService();
   * @returns {*}
   */
  get name() {
    return this.constructor.name;
  }

  get nix() {
    return this._nix;
  }

  /**
   * Lifecycle callback for when Nix is loading the services. You can use this
   * callback to configure
   *
   * @param config {NixConfig} The config file for Nix
   * @returns {boolean}
   */
  configureService(config) {
    return true;
  }

  /**
   *
   * @param guild
   * @returns {boolean}
   */
  onNixJoinGuild(guild) {
    return true;
  }

  /**
   *
   * @returns {boolean}
   */
  onNixListen() {
    return true;
  }
}

module.exports = Service;
