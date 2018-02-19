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
      ignoreArgReqs: true,
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

  run(context, response) {
    let moduleName = context.args.module;
    let actionName = context.args.action;

    if (context.flags.list) {
      response.type = 'embed';

      if (!moduleName) {
        response.content = context.nix.responseStrings.config.moduleList({});
        response.embed = moduleListEmbed(context);
      }
      else {
        response.content = context.nix.responseStrings.config.actionList({moduleName});
        response.embed = actionListEmbed(context, moduleName);
      }

      return response.send();
    }

    let action = context.nix.configActionService.getAction(moduleName, actionName);
    if (!action) {
      response.content = context.nix.responseStrings.config.actionNotFound({
        action: actionName,
        module: moduleName,
        prefix: context.nix.commandService.getPrefix(context.guild.id),
      });
      return response.send();
    }

    return action.run(context, response);
  },
};

function moduleListEmbed(context) {
  let prefix = context.nix.commandService.getPrefixForChannel(context.channel);
  let embed = new Discord.RichEmbed();
  embed.setDescription(`For more info: ${prefix}config \`module\` --list`);

  let moduleList = context.nix.configActionService.getModuleList();
  Object.values(moduleList).forEach((module) => {
    let actionList = Object.values(module.actions).map((action) => action.name);
    embed.addField(module.name, actionList.join(', '));
  });

  return embed;
}

function actionListEmbed(context, moduleName) {
  let prefix = context.nix.commandService.getPrefixForChannel(context.channel);
  let embed = new Discord.RichEmbed();

  let moduleList = context.nix.configActionService.getModuleList();
  let module = moduleList[moduleName.toLowerCase()];

  Object.values(module.actions).forEach((action) => {
    let usage = `${prefix}config ${module.name} ${action.name}`;
    let description = action.description;
    let inputs = [];

    if (typeof action.inputs !== 'undefined' && action.inputs.length >= 1) {
      action.inputs.forEach((input) => {
        usage += input.required ? ` \`${input.name}\`` : ` \`(${input.name})\``;

        inputLine = `\`${input.name}\``;
        if (!input.required) { inputLine += ' (optional)'; }
        if (input.description) { inputLine += `: ${input.description}`; }
        inputs.push(inputLine);
      });
    }

    fieldValues = [];
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
}

