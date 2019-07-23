const { of, throwError } = require('rxjs');
const { flatMap, map, catchError, mapTo } = require('rxjs/operators');

const ConfigAction = require("../../../models/config-action");

class DisablePluginAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: "disablePlugin",
      description: 'disable a plugin',

      args: [
        {
          name: 'pluginName',
          description: 'the name of the plugin to disable',
          required: true,
        },
      ],
    });

    this.chaos.on('chaos.listen', () => {
      this.pluginService = this.chaos.getService('core', 'pluginService');
    });
  }

  run(context) {
    const chaos = this.chaos;
    let pluginName = context.args.pluginName;

    if (!pluginName) {
      return of({
        status: 400,
        content: "A plugin name is required",
      });
    }

    return of(pluginName).pipe(
      map((pluginName) => chaos.getPlugin(pluginName)),
      flatMap((plugin) => this.pluginService.disablePlugin(context.guild.id, plugin.name).pipe(
        mapTo(plugin),
      )),
      map((plugin) => {
        return {
          status: 200,
          content: `The plugin ${plugin.name} is now disabled.`,
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
  }
}

module.exports = DisablePluginAction;