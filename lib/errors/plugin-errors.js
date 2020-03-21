const { ChaosError } = require("./chaos-errors");

class PluginError extends ChaosError {}

class LoadPluginError extends PluginError {}

class PluginDisabledError extends PluginError {}

class PluginAlreadyExistsError extends LoadPluginError {}

module.exports = {
  LoadPluginError,
  PluginDisabledError,
  PluginError,
  PluginAlreadyExistsError,
};
