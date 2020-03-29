const configActions = require('./config-actions');
const commands = require('./commands');
const defaultData = require('./default-data');
const services = require('./services');
const Plugin = require("../models/plugin");

class CorePlugin extends Plugin {
  name = 'core';
  description = "ChaosCore Core plugin.";

  defaultData = defaultData;
  permissionLevels = ['admin'];

  configActions = Object.values(configActions);
  commands = Object.values(commands);
  services = Object.values(services);
}

module.exports = CorePlugin;
