module.exports = {
  name: 'core',
  permissions: ['admin'],
  commands: [
    require('./commands/shutdown'),
    require('./commands/list-guilds'),
    require('./commands/config'),
    require('./commands/help'),
    require('./commands/test'),
  ],
};
