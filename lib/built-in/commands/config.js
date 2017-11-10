module.exports = {
  name: 'config',
  description: 'Edit core config settings',
  scope: 'text',
  adminOnly: true,
  showInHelp: false,
  enabledByDefault: true,

  flags: [],

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
    let module = context.nix.configManager.getModule(moduleName);
    if (!module) {
      response.type = 'message';
      response.content = context.nix.responseStrings.config.moduleNotFound({module: moduleName});
      return response.send();
    }

    let actionName = context.args.action;
    let action = module[actionName];
    if (!action) {
      response.type = 'message';
      response.content = context.nix.responseStrings.config.actionNotFound({action: actionName});
      return response.send();
    }

    return action(context, response);
  },
};
