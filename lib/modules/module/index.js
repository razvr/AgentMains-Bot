module.exports = {
  name: 'module',
  canBeDisabled: false,
  defaultData: [
    {
      keyword: 'core.enabledModules',
      data: {},
    },
  ],
  configActions: [
    require('./config/enable'),
    require('./config/disable'),
  ],
  commands: [],
};


