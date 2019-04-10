module.exports = {
  name: 'module',
  canBeDisabled: false,
  defaultData: [
    {
      keyword: 'core.enabledPlugins',
      data: {},
    },
  ],
  configActions: [
    require('./config/enable'),
    require('./config/disable'),
  ],
  commands: [],
};


