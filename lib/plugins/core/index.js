module.exports = {
  name: 'core',
  canBeDisabled: false,
  permissions: ['admin'],
  commands: [
    require('./commands/shutdown'),
    require('./commands/list-guilds'),
    require('./commands/config'),
    require('./commands/help'),
  ],
};
