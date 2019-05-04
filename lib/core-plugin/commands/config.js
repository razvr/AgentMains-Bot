const { iif, of, throwError, zip } = require("rxjs");
const { catchError, flatMap, map, tap } = require("rxjs/operators");
const Discord = require('discord.js');

const { toObservable } = require('../../utility');

module.exports = {
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
      description: 'input value',
      showInHelp: false,
      required: false,
    },
    {
      name: 'input2',
      description: 'input value',
      showInHelp: false,
      required: false,
    },
    {
      name: 'input3',
      description: 'input value',
      showInHelp: false,
      required: false,
    },
    {
      name: 'input4',
      description: 'input value',
      showInHelp: false,
      required: false,
    },
    {
      name: 'input5',
      description: 'input value',
      showInHelp: false,
      required: false,
    },
  ],

  onListen() {
    this.commandService = this.chaos.getService('core', 'commandService');
    this.pluginService = this.chaos.getService('core', 'pluginService');
  },

  checkMissingArgs(context) {
    if (context.flags["list"]) {
      return false;
    } else {
      return this.requiredArgs.some((arg) => typeof context.args[arg.name] === 'undefined');
    }
  },

  run(context, response) {
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
              content: context.chaos.responseStrings.config.pluginNotFound({
                pluginName,
                prefix,
              }),
            });
          case "PluginNotEnabledError":
            return response.send({
              type: 'message',
              content: context.chaos.responseStrings.config.pluginNotEnabled({
                pluginName,
                prefix,
              }),
            });
          case "ConfigActionNotFoundError":
            return response.send({
              type: 'message',
              content: context.chaos.responseStrings.config.actionNotFound({
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
  },

  runAction(context, response) {
    let guild = context.guild;
    let pluginName = context.args.plugin;
    let actionName = context.args.action;

    return zip(
      of(this.chaos.getPlugin(pluginName)),
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
      map((plugin) => this.chaos.getConfigAction(plugin.name, actionName)),
      tap((action) => {
        context.inputs = {};
        action.inputs.forEach((input, index) => {
          context.inputs[input.name] = context.args[`input${index + 1}`];
        });
      }),
      flatMap((action) => toObservable(action.run(context))),
      tap((result) => {
        response.content = result.content;

        if (result.embed) {
          response.type = 'embed';
          response.embed = result.embed;
        }
      }),
      flatMap(() => response.send()),
    );
  },

  listActions(context, response) {
    let pluginName = context.args.plugin;

    response.type = 'embed';

    if (pluginName) {
      response.content = context.chaos.responseStrings.config.actionList({ pluginName });
      response.embed = this.actionListEmbed(context);
    } else {
      response.content = context.chaos.responseStrings.config.pluginList({});
      response.embed = this.pluginListEmbed(context);
    }

    return response.send();
  },

  pluginListEmbed(context) {
    let prefix = this.commandService.getPrefixForChannel(context.channel);
    let embed = new Discord.RichEmbed();
    embed.setDescription(`For more info: ${prefix}config \`plugin\` --list`);

    let pluginList = this.pluginService.plugins;
    Object.values(pluginList).forEach((plugin) => {
      let actionList = plugin.configActions.map((action) => action.name);
      if (actionList.length >= 1) {
        embed.addField(plugin.name, actionList.join(', '));
      }
    });

    return embed;
  },

  actionListEmbed(context) {
    let pluginName = context.args.plugin;
    let prefix = this.commandService.getPrefixForChannel(context.channel);
    let embed = new Discord.RichEmbed();

    let plugin = context.chaos.getPlugin(pluginName);

    Object.values(plugin.configActions).forEach((action) => {
      let usage = `${prefix}config ${plugin.name} ${action.name}`;
      let description = action.description;
      let inputs = [];

      if (typeof action.inputs !== 'undefined' && action.inputs.length >= 1) {
        action.inputs.forEach((input) => {
          usage += input.required ? ` \`${input.name}\`` : ` \`(${input.name})\``;

          let inputLine = `\`${input.name}\``;
          if (!input.required) {
            inputLine += ' (optional)';
          }
          if (input.description) {
            inputLine += `: ${input.description}`;
          }
          inputs.push(inputLine);
        });
      }

      let fieldValues = [];
      if (description) {
        fieldValues.push(`*Description*:\n\t${description}`);
      }

      fieldValues.push(`*Usage*:\n\t${usage}`);

      if (inputs.length >= 1) {
        fieldValues.push(`*Inputs*:\n\t${inputs.join('\n\t')}`);
      }

      embed.addField(action.name, fieldValues.join('\n'));
    });

    return embed;
  },
};
