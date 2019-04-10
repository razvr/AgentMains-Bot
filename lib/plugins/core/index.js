const configActions = require('./config-actions');
const commands = require('./commands');
const DataKeys = require('./datakeys');

module.exports = {
  name: 'core',
  defaultData: [
    { keyword: DataKeys.COMMAND_PREFIX, data: '!' },
    { keyword: DataKeys.ENABLED_PLUGINS, data: {} },
    { keyword: DataKeys.ENABLED_COMMANDS, data: {} },
  ],
  permissions: [
    'admin',
  ],
  configActions: Object.values(configActions),
  commands: Object.values(commands),
};
