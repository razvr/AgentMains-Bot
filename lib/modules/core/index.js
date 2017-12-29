module.exports = {
  name: 'core',
  defaultData: [],
  configActions: [],
  commands: [
    require('./commands/config'),
    require('./commands/help'),
    require('./commands/test'),
  ],
};
