const Rx = require('rx');

module.exports = {
  name: "enablePlugin",
  description: 'enable a plugin',

  inputs: [
    {
      name: 'pluginName',
      description: 'the name of the plugin to enable',
      required: true,
    },
  ],

  onListen() {
    this.pluginService = this.chaos.getService('core', 'pluginService');
  },

  run (context) {
    let pluginName = context.inputs.pluginName;

    if (!pluginName) {
      return Rx.Observable.of({
        status: 400,
        content: "A module name is required",
      });
    }

    return Rx.Observable.of(pluginName)
      .map((pluginName) => context.chaos.getPlugin(pluginName))
      .flatMap((plugin) => this.pluginService.enablePlugin(context.guild.id, plugin.name).map(plugin))
      .map((plugin) => {
        return {
          status: 200,
          content: `The module ${plugin.name} is now enabled.`,
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
