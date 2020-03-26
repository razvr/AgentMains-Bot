/**
 * Container for all config options that are needed for ChaosCore plugins or services
 */
class ChaosConfig {
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
    this.strings = {};

    this.defaultPrefix = '!';

    this.plugins = [];

    this.messageOwnerOnBoot = true;

    // Overwrite defaults
    Object.assign(this, options);
  }

  /**
   * Verifies that the config has all required fields and is valid
   */
  verifyConfig() {
    if (!this.ownerUserId) { throw new InvalidConfigError("ownerUserId is required"); }
    if (!this.loginToken)  { throw new InvalidConfigError("loginToken is required"); }
  }
}

class InvalidConfigError extends Error {}

module.exports = ChaosConfig;
module.exports.InvalidConfigError = InvalidConfigError;
