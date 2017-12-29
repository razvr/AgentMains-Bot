module.exports = {
  name: 'module',
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


