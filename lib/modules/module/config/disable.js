module.exports = {
  name: "disable",
  description: 'disable a module',
  inputs: [
    {
      name: 'module',
      description: 'the name of the module to disable',
      required: true,
    },
  ],
  run: (context, response) => {
    let nix = context.nix;
    let moduleName = context.args.input1;

    if (!moduleName) {
      return response.send({content: "A module name is required"});
    }

    if (!nix.moduleService.modules[moduleName]) {
      return response.send({content: `The module ${moduleName} does not exist`});
    }

    return nix.moduleService
      .isModuleEnabled(context.guild.id, moduleName)
      .flatMap((isEnabled) => {
        if (!isEnabled) { throw new Error('Module is already disabled'); }
        return nix.data.getGuildData(context.guild.id, 'core.enabledModules');
      })
      .flatMap((savedData) => {
        savedData[moduleName] = false;
        return nix.data.setGuildData(context.guild.id, 'core.enabledModules', savedData);
      })
      .flatMap((savedData) => {
        if (savedData[moduleName] !== false) {
          throw new Error("Unable to disable module");
        }
        response.content = `The module ${moduleName} has been disabled`;
        return response.send();
      })
      .catch((error) => {
        if (error.message === 'Module is already disabled') {
          return response.send({content: `The module ${moduleName} is already disabled`});
        }
        else {
          throw error;
        }
      });
  },
};
