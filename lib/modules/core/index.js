module.exports = {
  name: 'core',
  permissions: ['admin'],
  defaultData: [],
  configActions: [],
  commands: [
    require('./commands/config'),
    require('./commands/help'),
    require('./commands/test'),
  ],
};
