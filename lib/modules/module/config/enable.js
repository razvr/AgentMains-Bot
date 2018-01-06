const Rx = require('rx');

const ModuleService = require('../../../services/module-service');

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
    if (!moduleName) { return response.send({content: "A module name is required"}); }

    return Rx.Observable.of(moduleName)
      .map((moduleName) => nix.moduleService.getModule(moduleName))
      .flatMap((module) => nix.moduleService.enableModule(context.guild.id, module.name).map(module))
      .flatMap((module) => response.send({content: `The module ${module.name} is now enabled.`}))
      .catch((error) => {
        switch (error.message) {
          case ModuleService.ERRORS.MODULE_NOT_FOUND:
            return response.send({content: `The module ${moduleName} does not exist`});
          case ModuleService.ERRORS.MODULE_ALREADY_ENABLED:
            return response.send({content: `That module is already enabled`});
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
