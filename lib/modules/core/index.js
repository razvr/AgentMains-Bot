DATAKEY_ENABLED_MODULES = 'core.enabledModules';

module.exports = {
  name: 'core',
  defaultData: [
    {
      keyword: DATAKEY_ENABLED_MODULES,
      data: {},
    },
  ],
  configActions: [
    {
      name: "enableModule",
      inputs: {
        name: 'module',
        description: 'the name of the module to enable',
        required: true,
      },
      run: (context, response) => {
        let module = context.args.input1;

        return getModuleData(context.guildId)
          .flatMap((savedData) => {
            savedData[module] = true;
            setModuleData(context.guildId, savedData);
          })
          .flatMap((savedData) => {
            response.content = "done. enabled";
            response.send();
          });
      },
    },
    {
      name: "disableModule",
      inputs: {
        name: 'module',
        description: 'the name of the module to disable',
        required: true,
      },
      run: (context, response) => {
        let module = context.args.input1;

        return getModuleData(context.guildId)
          .flatMap((savedData) => {
            savedData[module] = false;
            setModuleData(context.guildId, savedData);
          })
          .flatMap((savedData) => {
            response.content = "done. disabled";
            response.send();
          });
      },
    },
  ],
  commands: [
    require('./commands/config'),
    require('./commands/help'),
    require('./commands/test'),
  ],
};

function getModuleData(guildId) {
  return this.dataManager.getGuildData(guildId, DATAKEY_ENABLED_MODULES);
}

function setModuleData(guildId, data) {
  return this.dataManager.setGuildData(guildId, DATAKEY_ENABLED_MODULES, data);
}
