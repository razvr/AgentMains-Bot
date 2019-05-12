const { of, throwError } = require('rxjs');
const { flatMap, map, catchError, mapTo } = require('rxjs/operators');

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

  run(context) {
    const chaos = this.chaos;
    let pluginName = context.inputs.pluginName;

    if (!pluginName) {
      return of({
        status: 400,
        content: "A plugin name is required",
      });
    }

    return of(pluginName).pipe(
      map((pluginName) => chaos.getPlugin(pluginName)),
      flatMap((plugin) => this.pluginService.enablePlugin(context.guild.id, plugin.name).pipe(
        mapTo(plugin),
      )),
      map((plugin) => {
        return {
          status: 200,
          content: `The plugin ${plugin.name} is now enabled.`,
        };
      }),
      catchError((error) => {
        switch (error.name) {
          case 'PluginNotFoundError':
          case 'PluginError':
            return of({ status: 400, content: error.message });
          default:
            return throwError(error);
        }
      }),
    );
  },
};
