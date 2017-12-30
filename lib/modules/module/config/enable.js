module.exports = {
  name: "enable",
  inputs: {
    name: 'module',
    description: 'the name of the module to enable',
    required: true,
  },
  run: (context, response) => {
    let nix = context.nix;
    let module = context.args.input1;

    if (!module) {
      response.content = "A module name is required";
      return response.send();
    }

    return nix.data
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
