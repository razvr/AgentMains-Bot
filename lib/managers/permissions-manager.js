class PermissionsManager {
  get chaos() {
    return this._chaos;
  }

  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  get levels() {
    // replace the keys with the case sensitive names
    return Object.values(this._levels);
  }

  constructor(chaos) {
    this._chaos = chaos;
    this._levels = {};

    //Bind methods for aliasing to ChaosCore
    this.addPermissionLevel = this.addPermissionLevel.bind(this);
    this.getPermissionLevel = this.getPermissionLevel.bind(this);
  }

  addPermissionLevel(level) {
    this._levels[level.toLowerCase()] = level;
  }

  getPermissionLevel(levelName) {
    let level = this._levels[levelName.toLowerCase()];
    if (!level) {
      let error = new Error(`The permission level '${levelName}' could not be found.`);
      error.name = "PermLevelNotFoundError";
      throw error;
    }

    return level;
  }
}

module.exports = PermissionsManager;
