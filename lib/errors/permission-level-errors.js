class PermissionLevelError extends Error {
  constructor(message) {
    super(message);
    this.name = "PermissionLevelError";
  }
}

class PermissionLevelNotFound extends PermissionLevelError {
  constructor(message) {
    super(message);
    this.name = "PermissionLevelNotFound";
  }
}

module.exports = {
  PermissionLevelError,
  PermissionLevelNotFound,
};
