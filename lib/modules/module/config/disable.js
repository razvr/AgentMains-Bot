module.exports = {
  name: "disable",
  inputs: {
    name: 'module',
    description: 'the name of the module to disable',
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
        savedData[module] = false;
        return dataManager.setGuildData(context.guild.id, 'core.enabledModules', savedData);
      })
      .flatMap((savedData) => {
        if (savedData[module] !== false) {
          throw new Error("Unable to disable module");
        }
        response.content = "done. disabled";
        return response.send();
      });
  },
};
