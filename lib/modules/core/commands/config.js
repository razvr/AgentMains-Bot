const Rx = require('rx');

const Discord = require('discord.js');

module.exports = {
  name: 'config',
  description: 'Edit or view settings for this guild',
  permissions: ['admin'],

  flags: [
    {
      name: 'list',
      shortAlias: 'l',
      description: "List all available modules and actions",
      type: 'boolean',
      default: false,
    },
  ],

  args: [
    {
      name: 'module',
      description: 'the module to configure',
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

  configureCommand() {
    this.commandService = this.chaos.getService('core', 'commandService');
    this.moduleService = this.chaos.getService('core', 'moduleService');
  },

  checkMissingArgs(context) {
    if (context.flags["list"]) {
      return false;
    } else {
      return this.requiredArgs.some((arg) => typeof context.args[arg.name] === 'undefined');
    }
  },

  run(context, response) {
    let moduleName = context.args.module;
    let actionName = context.args.action;
    let prefix = this.commandService.getPrefixForChannel(context.channel);

    return Rx.Observable
      .if(
        () => context.flags.list,
        this.listActions(context, response),
        this.runAction(context, response),
      )
      .catch((error) => {
        switch (error.name) {
          case "ModuleNotFoundError":
            return response.send({
              type: 'message',
              content: context.chaos.responseStrings.config.moduleNotFound({
                moduleName,
                prefix,
              }),
            });
          case "ModuleNotEnabledError":
            return response.send({
              type: 'message',
              content: context.chaos.responseStrings.config.moduleNotEnabled({
                moduleName,
                prefix,
              }),
            });
          case "ConfigActionNotFoundError":
            return response.send({
              type: 'message',
              content: context.chaos.responseStrings.config.actionNotFound({
                moduleName,
                actionName,
                prefix,
              }),
            });
          default:
            throw error;
        }
      });
  },

  runAction(context, response) {
    let guild = context.guild;
    let moduleName = context.args.module;
    let actionName = context.args.action;

    return Rx.Observable
      .of('')
      .flatMap(() => Rx.Observable.combineLatest(
        Rx.Observable.of(this.chaos.getModule(moduleName)),
        this.moduleService.isModuleEnabled(guild.id, moduleName),
      ))
      .flatMap(([module, moduleEnabled]) => {
        if (!moduleEnabled) {
          let error = new Error(`The module ${module.name} is not enabled.`);
          error.name = "ModuleNotEnabledError";
          throw error;
        }

        let action = this.chaos.getConfigAction(module.name, actionName);

        context.inputs = {};
        action.inputs.forEach((input, index) => {
          context.inputs[input.name] = context.args[`input${index + 1}`];
        });

        return action.run(context);
      })
      .flatMap((result) => {
        response.content = result.content;

        if (result.embed) {
          response.type = 'embed';
          response.embed = result.embed;
        }

        return response.send();
      });
  },

  listActions(context, response) {
    let moduleName = context.args.module;

    return Rx.Observable.of('')
      .flatMap(() => {
        response.type = 'embed';

        if (moduleName) {
          response.content = context.chaos.responseStrings.config.actionList({ moduleName });
          response.embed = this.actionListEmbed(context);
        } else {
          response.content = context.chaos.responseStrings.config.moduleList({});
          response.embed = this.moduleListEmbed(context);
        }

        return response.send();
      });
  },

  moduleListEmbed(context) {
    let prefix = this.commandService.getPrefixForChannel(context.channel);
    let embed = new Discord.RichEmbed();
    embed.setDescription(`For more info: ${prefix}config \`module\` --list`);

    let moduleList = this.moduleService.modules;
    Object.values(moduleList).forEach((module) => {
      let actionList = module.configActions.map((action) => action.name);
      if (actionList.length >= 1) {
        embed.addField(module.name, actionList.join(', '));
      }
    });

    return embed;
  },

  actionListEmbed(context) {
    let moduleName = context.args.module;
    let prefix = this.commandService.getPrefixForChannel(context.channel);
    let embed = new Discord.RichEmbed();

    let module = context.chaos.getModule(moduleName);

    Object.values(module.configActions).forEach((action) => {
      let usage = `${prefix}config ${module.name} ${action.name}`;
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
