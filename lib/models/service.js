class Service {
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

  set nix(value) {
    this._nix = value;
  }

  /**
   * Lifecycle callback for when Nix is loading the services.
   *
   * @param config {NixConfig} The config file for Nix
   * @returns {boolean}
   */
  onInitalize(config) {
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
