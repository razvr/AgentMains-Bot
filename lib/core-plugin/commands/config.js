const { iif, of, throwError, zip } = require("rxjs");
const { catchError, flatMap, map, filter } = require("rxjs/operators");
const Discord = require('discord.js');

const Command = require("../../models/command");
const { toObservable } = require('../../utility');

class ConfigCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: 'config',
      description: 'Edit or view settings for this guild',
      permissions: ['admin'],

      flags: [
        {
          name: 'list',
          shortAlias: 'l',
          description: "List all available plugins and actions",
          type: 'boolean',
          default: false,
        },
      ],

      args: [
        {
          name: 'plugin',
          description: 'the plugin to configure',
          required: true,
        },
        {
          name: 'action',
          description: 'the config action to perform',
          required: true,
        },
        {
          name: 'input1',
          showInHelp: false,
          required: false,
        },
        {
          name: 'input2',
          showInHelp: false,
          required: false,
        },
        {
          name: 'input3',
          showInHelp: false,
          required: false,
        },
        {
          name: 'input4',
          showInHelp: false,
          required: false,
        },
        {
          name: 'input5',
          showInHelp: false,
          required: false,
        },
      ],
    });

    this.chaos.on('chaos.listen:before', () => {
      this.commandService = this.chaos.getService('core', 'CommandService');
      this.pluginService = this.chaos.getService('core', 'PluginService');
    });
  }

  checkMissingArgs(context) {
    if (context.flags["list"]) {
      return false;
    } else {
      return this.requiredArgs.some((arg) => typeof context.args[arg.name] === 'undefined');
    }
  }

  run(context, response) {
    const chaos = this.chaos;
    let pluginName = context.args.plugin;
    let actionName = context.args.action;
    let prefix = this.commandService.getPrefixForChannel(context.channel);

    return iif(
      () => context.flags.list,
      of('').pipe(flatMap(() => this.listActions(context, response))),
      of('').pipe(flatMap(() => this.runAction(context, response))),
    ).pipe(
      catchError((error) => {
        switch (error.name) {
          case "PluginNotFoundError":
            return response.send({
              type: 'message',
              content: chaos.responseStrings.config.pluginNotFound({
                pluginName,
                prefix,
              }),
            });
          case "PluginNotEnabledError":
            return response.send({
              type: 'message',
              content: chaos.responseStrings.config.pluginNotEnabled({
                pluginName,
                prefix,
              }),
            });
          case "ConfigActionNotFoundError":
            return response.send({
              type: 'message',
              content: chaos.responseStrings.config.actionNotFound({
                pluginName,
                actionName,
                prefix,
              }),
            });
          default:
            throw error;
        }
      }),
    );
  }

  runAction(context, response) {
    const chaos = this.chaos;
    let guild = context.guild;
    let pluginName = context.args.plugin;
    let actionName = context.args.action;

    return zip(
      of(chaos.getPlugin(pluginName)),
      this.pluginService.isPluginEnabled(guild.id, pluginName),
    ).pipe(
      flatMap(([plugin, pluginEnabled]) => {
        if (!pluginEnabled) {
          let error = new Error(`The plugin ${plugin.name} is not enabled.`);
          error.name = "PluginNotEnabledError";
          return throwError(error);
        } else {
          return of(plugin);
        }
      }),
      map((plugin) => chaos.getConfigAction(plugin.name, actionName)),
      flatMap((action) => toObservable(action.execAction(context))),
      filter((result) => result.content),
      flatMap((result) => response.send(result)),
    );
  }

  listActions(context, response) {
    let pluginName = context.args.plugin;

    response.type = 'embed';

    if (pluginName) {
      response.content = this.chaos.responseStrings.config.actionList({ pluginName });
      response.embed = this.actionListEmbed(context);
    } else {
      response.content = this.chaos.responseStrings.config.pluginList({});
      response.embed = this.pluginListEmbed(context);
    }

    return response.send();
  }

  pluginListEmbed(context) {
    let prefix = this.commandService.getPrefixForChannel(context.channel);
    let embed = new Discord.RichEmbed();
    embed.setDescription(`For more info: ${prefix}config \`plugin\` --list`);

    const actionLists = {};
    Object.values(this.chaos.configManager.actions).forEach((action) => {
      const plugin = this.pluginService.getPlugin(action.pluginName);
      if (!actionLists[plugin.name]) {
        actionLists[plugin.name] = [action.name];
      } else {
        actionLists[plugin.name].push(action.name);
      }
    });

    const pluginList = this.pluginService.plugins;
    Object.values(pluginList).forEach((plugin) => {
      let actionList = actionLists[plugin.name] || [];
      if (actionList.length >= 1) {
        embed.addField(plugin.name, actionList.join(', '));
      }
    });

    return embed;
  }

  actionListEmbed(context) {
    const pluginName = context.args.plugin;
    const prefix = this.commandService.getPrefixForChannel(context.channel);
    const embed = new Discord.RichEmbed();

    const configActions = Object.values(this.chaos.configManager.actions)
      .filter((action) => action.pluginName.toLowerCase() === pluginName.toLowerCase());

    configActions.forEach((action) => {
      let usage = `${prefix}config ${action.pluginName} ${action.name}`;
      let description = action.description;
      let args = [];

      if (typeof action.args !== 'undefined') {
        action.args.forEach((arg) => {
          usage += arg.required ? ` \`${arg.name}\`` : ` \`(${arg.name})\``;

          let argLine = `\`${arg.name}\``;
          if (!arg.required) {
            argLine += ' (optional)';
          }
          if (arg.description) {
            argLine += `: ${arg.description}`;
          }
          args.push(argLine);
        });
      }

      let fieldValues = [];
      if (description) {
        fieldValues.push(`*Description*:\n\t${description}`);
      }

      fieldValues.push(`*Usage*:\n\t${usage}`);

      if (args.length >= 1) {
        fieldValues.push(`*Args*:\n\t${args.join('\n\t')}`);
      }

      embed.addField(action.name, fieldValues.join('\n'));
    });

    return embed;
  }
}

module.exports = ConfigCommand;
