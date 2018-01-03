module.exports = {
  name: "enable",
  description: 'enable a module',
  inputs: [
    {
      name: 'module',
      description: 'the name of the module to enable',
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
        if (isEnabled) { throw new Error('Module is already enabled'); }
        return nix.data.getGuildData(context.guild.id, 'core.enabledModules');
      })
      .flatMap((savedData) => {
        savedData[moduleName] = true;
        return nix.data.setGuildData(context.guild.id, 'core.enabledModules', savedData);
      })
      .flatMap((savedData) => {
        if (savedData[moduleName] !== true) {
          throw new Error("Unable to enable module");
        }
        response.content = `The module ${moduleName} has been enabled`;
        return response.send();
      })
      .catch((error) => {
        if (error.message === 'Module is already enabled') {
          return response.send({content: `The module ${moduleName} is already enabled`});
        }
        else {
          throw error;
        }
      });
  },
};
