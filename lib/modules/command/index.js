const Rx = require('rx');

module.exports = {
  name: 'command',
  defaultData: [
    { keyword: 'core.enabledCommands', data: {} },
    { keyword: 'core.commandPrefix', data: '!' },
  ],
  configActions: [
    require('./config/enable'),
    require('./config/disable'),
    require('./config/enabled'),
    require('./config/list'),
  ],
  commands: [],
};
