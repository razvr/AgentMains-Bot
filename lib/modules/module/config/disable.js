const Rx = require('rx');

const ModuleService = require('../../../services/module-service');

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
    if (!moduleName) { return response.send({content: "A module name is required"}); }

    return Rx.Observable.of(moduleName)
      .map((moduleName) => nix.moduleService.getModule(moduleName))
      .flatMap((module) => nix.moduleService.disableModule(context.guild.id, module.name).map(module))
      .flatMap((module) => response.send({content: `The module ${module.name} is now disabled.`}))
      .catch((error) => {
        switch (error.message) {
          case ModuleService.ERRORS.MODULE_NOT_FOUND:
            return response.send({content: `The module ${moduleName} does not exist`});
          case ModuleService.ERRORS.MODULE_ALREADY_DISABLED:
            return response.send({content: `That module is already disabled`});
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
