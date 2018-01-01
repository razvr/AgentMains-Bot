module.exports = {
  name: 'modTools',
  permissions: ['mod'],
  defaultData: [
    {
      keyword: 'modTools.modLogChannel',
      data: null,
    },
  ],
  configActions: [
    require('./config/enableModLog'),
    require('./config/disableModLog'),
  ],
  commands: [
    require('./commands/warn.js'),
    require('./commands/ban.js'),
    require('./commands/unban.js'),
  ],
};
