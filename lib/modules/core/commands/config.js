const Discord = require('discord.js');

module.exports = {
  name: 'config',
  description: 'Edit guild config settings',
  scope: 'text',
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
    if (context.flags.list) {
      response.type = 'embed';
      response.content = context.nix.responseStrings.config.moduleList({});
      response.embed = moduleListEmbed(context);
      return response.send();
    }

    let moduleName = context.args.module;
    let actionName = context.args.action;

    let action = context.nix.configManager.getAction(moduleName, actionName);
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
  let embed = new Discord.MessageEmbed();
  embed.setDescription(`Usage: ${prefix}config \`module\` \`action\` \`inputs\``);

  let actionList = context.nix.configManager.getActionList();
  for (let moduleName in actionList) {
    let actions = actionList[moduleName];
    let moduleActionList = [];

    actions.forEach((action) => {
      let fieldValue = `**${action.name}**`;

      if (typeof action.inputs !== 'undefined') {
        action.inputs.forEach((input) => {
          fieldValue += input.required ? ` ${input.name}` : ` (${input.name})`;
        });
      }

      if (typeof action.description !== 'undefined') {
        fieldValue += `\n\t*${action.description}*`;
      }
      moduleActionList.push(fieldValue);
    });

    embed.addField(`=== Module: ${moduleName} ===`, moduleActionList.join('\n\n'));
  }

  return embed;
};

