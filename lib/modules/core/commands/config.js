module.exports = {
  name: 'config',
  description: 'Edit guild config settings',
  scope: 'text',
  adminOnly: true,
  showInHelp: false,
  enabledByDefault: true,

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
      response.type = 'embed';
      response.content = context.nix.responseStrings.config.actionNotFound({action: actionName, module: moduleName});
      response.embed = moduleListEmbed(context);
      return response.send();
    }

    return action(context, response);
  },
};

function moduleListEmbed(context) {
  let embed = {
    fields: [],
  };

  let actionList = context.nix.configManager.getActionList();
  for (let moduleName in actionList) {
    let actions = actionList[moduleName];
    embed.fields.push({
      name: moduleName,
      value: "*Actions:*\n\t" + actions.join('\n\t'),
    });
  }

  return embed;
};

