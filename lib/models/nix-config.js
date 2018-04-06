/**
 * Container for all config options that are needed for Nix modules or services
 */
class NixConfig {
  /**
   * Create a new instance of the config
   * @param options
   */
  constructor(options) {
    // Defaults
    this.ownerUserId = null;
    this.loginToken = null;

    this.discord = {};
    this.dataSource = { type: 'memory' };
    this.logger = {};
    this.responseStrings = {};

    // Overwrite defaults
    Object.entries(options).forEach(([key, value]) => this[key] = value);
  }
}

module.exports = NixConfig;
