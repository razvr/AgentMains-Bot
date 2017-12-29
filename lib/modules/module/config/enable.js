module.exports = {
  name: "enable",
  inputs: {
    name: 'module',
    description: 'the name of the module to enable',
    required: true,
  },
  run: (context, response) => {
    let dataManager = context.nix.dataManager;
    let module = context.args.input1;

    if (!module) {
      response.content = "A module name is required";
      return response.send();
    }

    return dataManager
      .getGuildData(context.guild.id, 'core.enabledModules')
      .flatMap((savedData) => {
        savedData[module] = true;
        return dataManager.setGuildData(context.guild.id, 'core.enabledModules', savedData);
      })
      .flatMap((savedData) => {
        if (savedData[module] !== true) {
          throw new Error("Unable to enable module");
        }
        response.content = "done. enabled";
        return response.send();
      });
  },
};
