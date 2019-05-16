class LoadPluginError extends Error {
  constructor(message) {
    super(message);
    this.name = "LoadPluginError";
  }
}

class PluginDisabledError extends Error {
  constructor(message) {
    super(message);
    this.name = "PluginDisabledError";
  }
}

module.exports = {
  LoadPluginError,
  PluginDisabledError,
};