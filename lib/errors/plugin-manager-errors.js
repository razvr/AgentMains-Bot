class LoadPluginError extends Error {
  constructor(message) {
    super(message);
    this.name = "LoadPluginError";
  }
}

module.exports = {
  LoadPluginError,
};