class PermissionsManager {
  get nix() {
    return this._nix;
  }

  get levels() {
    // replace the keys with the case sensitive names
    return Object.values(this._levels);
  }

  constructor(nix) {
    this._nix = nix;
    this._levels = {};

    //Bind methods for aliasing to NixCore
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
