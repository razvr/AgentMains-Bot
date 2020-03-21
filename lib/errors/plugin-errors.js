const { ChaosError } = require("./chaos-errors");

class PluginError extends ChaosError {}

class LoadPluginError extends PluginError {}

class PluginDisabledError extends PluginError {}

class PluginAlreadyExistsError extends LoadPluginError {}

class PluginNotEnabledError extends PluginDisabledError {}

class PluginNotFoundError extends PluginError {}

module.exports = {
  LoadPluginError,
  PluginDisabledError,
  PluginError,
  PluginAlreadyExistsError,
  PluginNotEnabledError,
  PluginNotFoundError,
};
