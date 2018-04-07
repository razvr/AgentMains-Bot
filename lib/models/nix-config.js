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

    this.defaultPrefix = '!';
    this.commands = [];

    this.messageOwnerOnBoot = true;

    // Overwrite defaults
    Object.entries(options).forEach(([key, value]) => this[key] = value);
  }

  /**
   * Verifies that the config has all required fields and is valid
   */
  verifyConfig() {
    if (!this.ownerUserId) { throw InvalidConfigError("ownerUserId is required"); }
    if (!this.loginToken)  { throw InvalidConfigError("loginToken is required"); }
  }
}

class InvalidConfigError extends Error {}

module.exports = NixConfig;
module.exports.InvalidConfigError = InvalidConfigError;
