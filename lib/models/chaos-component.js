class ChaosComponent {
  constructor(chaos) {
    this._chaos = chaos;
  }

  get chaos() {
    return this._chaos;
  }

  /**
   * Alias for easy access to the chaos logger
   *
   * @returns {Logger}
   */
  get logger() {
    return this.chaos.logger;
  }

  /**
   * Alias for easy access to chaos strings
   * Recommended to override to allow for quicker access to related strings
   *
   * @returns {Object}
   */
  get strings() {
    return this.chaos.strings;
  }

  async getGuildData(guildId, key) {
    return this.chaos.dataManager.getGuildData(guildId, key).toPromise();
  }

  async setGuildData(guildId, key, data) {
    return this.chaos.dataManager.setGuildData(guildId, key, data).toPromise();
  }

  async getUserData(userId, key) {
    return this.chaos.dataManager.getUserData(userId, key).toPromise();
  }

  async setUserData(userId, key, data) {
    return this.chaos.dataManager.setUserData(userId, key, data).toPromise();
  }

  getService(pluginName, serviceName) {
    return this.chaos.servicesManager.getService(pluginName, serviceName);
  }

  validate() {
    return true;
  }
}

module.exports = ChaosComponent;
