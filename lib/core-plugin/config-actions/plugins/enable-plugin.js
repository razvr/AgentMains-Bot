const { of, throwError } = require('rxjs');
const { flatMap, map, catchError, mapTo } = require('rxjs/operators');

const ConfigAction = require("../../../models/config-action");

class EnablePluginAction extends ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: "enablePlugin",
      description: 'enable a plugin',

      args: [
        {
          name: 'pluginName',
          description: 'the name of the plugin to enable',
          required: true,
        },
      ],
    });

    this.chaos.on('chaos.listen', () => {
      this.pluginService = this.getService('core', 'pluginService');
    });
  }

  get strings() {
    return this.chaos.strings.core.configActions.plugins.enablePlugin;
  }

  run(context) {
    const chaos = this.chaos;
    let pluginName = context.args.pluginName;

    return of(pluginName).pipe(
      map((pluginName) => chaos.getPlugin(pluginName)),
      flatMap((plugin) => this.pluginService.enablePlugin(context.guild.id, plugin.name).pipe(
        mapTo(plugin),
      )),
      map((plugin) => {
        return {
          status: 200,
          content: this.strings.pluginEnabled({ pluginName: plugin.name }),
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

module.exports = EnablePluginAction;
