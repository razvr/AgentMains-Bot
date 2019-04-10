const Rx = require('rx');

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

  configureAction() {
    this.pluginService = this.nix.getService('core', 'pluginService');
  },

  run (context) {
    let pluginName = context.inputs.module;

    if (!pluginName) {
      return Rx.Observable.of({
        status: 400,
        content: "A module name is required",
      });
    }

    return Rx.Observable.of(pluginName)
      .map((pluginName) => context.nix.getPlugin(pluginName))
      .flatMap((module) => this.pluginService.disablePlugin(context.guild.id, module.name).map(module))
      .map((module) => {
        return {
          status: 200,
          content: `The module ${module.name} is now disabled.`,
        };
      })
      .catch((error) => {
        switch (error.name) {
          case 'PluginNotFoundError':
          case 'PluginError':
            return Rx.Observable.of({ status: 400, content: error.message });
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
