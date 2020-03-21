class PluginError extends Error {
  constructor(message) {
    super(message);
    this.name = "PluginError";
  }
}

class LoadPluginError extends PluginError {
  constructor(message) {
    super(message);
    this.name = "LoadPluginError";
  }
}

class PluginDisabledError extends PluginError {
  constructor(message) {
    super(message);
    this.name = "PluginDisabledError";
  }
}

class PluginAlreadyExistsError extends LoadPluginError {
  constructor(message) {
    super(message);
    this.name = "PluginAlreadyExistsError";
  }
}

module.exports = {
  LoadPluginError,
  PluginDisabledError,
  PluginError,
  PluginAlreadyExistsError,
};
