module.exports = {
  name: "disable",
  inputs: {
    name: 'module',
    description: 'the name of the module to disable',
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
        savedData[module] = false;
        return nix.data.setGuildData(context.guild.id, 'core.enabledModules', savedData);
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
