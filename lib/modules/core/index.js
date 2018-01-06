module.exports = {
  name: 'core',
  permissions: ['admin'],
  defaultData: [],
  configActions: [],
  commands: [
    require('./commands/shutdown'),
    require('./commands/list-guilds'),
    require('./commands/config'),
    require('./commands/help'),
  ],
};
