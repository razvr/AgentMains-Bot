const Rx = require('rx');

const ModuleService = require('../../../services/module-service');

module.exports = {
  name: "enable",
  description: 'enable a module',

  services: {
    core: [
      'moduleService',
    ],
  },

  inputs: [
    {
      name: 'module',
      description: 'the name of the module to enable',
      required: true,
    },
  ],
  run: (context) => {
    let nix = context.nix;
    let moduleName = context.args.input1;

    if (!moduleName) {
      return Rx.Observable.of({
        status: 400,
        content: "A module name is required",
      });
    }

    return Rx.Observable.of(moduleName)
      .map((moduleName) => this.moduleService.getModule(moduleName))
      .flatMap((module) => this.moduleService.enableModule(context.guild.id, module.name).map(module))
      .map((module) => {
        return {
          status: 200,
          content: `The module ${module.name} is now enabled.`,
        };
      })
      .catch((error) => {
        switch (error.message) {
          case ModuleService.ERRORS.MODULE_NOT_FOUND:
            return Rx.Observable.of({
              status: 400,
              content: `The module ${moduleName} does not exist`,
            });
          case ModuleService.ERRORS.MODULE_ALREADY_ENABLED:
            return Rx.Observable.of({
              status: 400,
              content: `That module is already enabled`,
            });
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
