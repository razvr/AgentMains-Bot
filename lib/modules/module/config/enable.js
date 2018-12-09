const Rx = require('rx');

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

  configureAction() {
    this.moduleService = this.nix.getService('core', 'moduleService');
  },

  run (context) {
    let moduleName = context.inputs.module;

    if (!moduleName) {
      return Rx.Observable.of({
        status: 400,
        content: "A module name is required",
      });
    }

    return Rx.Observable.of(moduleName)
      .map((moduleName) => context.nix.getModule(moduleName))
      .flatMap((module) => this.moduleService.enableModule(context.guild.id, module.name).map(module))
      .map((module) => {
        return {
          status: 200,
          content: `The module ${module.name} is now enabled.`,
        };
      })
      .catch((error) => {
        switch (error.name) {
          case 'ModuleNotFoundError':
          case 'ModuleError':
            return Rx.Observable.of({ status: 400, content: error.message });
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
