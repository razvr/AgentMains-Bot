const defaultResponseStrings = {
  config: {
    moduleList: () =>
      `Here's a list of plugins with config actions:`,
    actionList: ({pluginName}) =>
      `Here's a list of config actions for ${pluginName}:`,
    moduleNotFound: ({pluginName, prefix}) =>
      `There is no module "${pluginName}".\n` +
      `You can use \`${prefix}config --list\` to see a list of all config actions.`,
    moduleNotEnabled: ({ pluginName, prefix }) =>
      `The module "${pluginName}" is currently disabled.\n` +
      `You can use \`${prefix}config module enable ${pluginName}\` to enable it.`,
    actionNotFound: ({ pluginName, actionName, prefix}) =>
      `There is no config action "${pluginName} ${actionName}".\n` +
      `You can use \`${prefix}config ${pluginName} --list\` to see a list of all config actions.`,
  },
  commandParsing: {
    help: () =>
      "Here's how to use that command:",
    error: {
      missingArgument: () =>
        "I'm sorry, but I'm missing some information for that command:",
      wrongScope: {
        generic: () =>
          "I'm sorry, but that command isn't available here.",
        textChannelOnly: () =>
          "I'm sorry, but that command can only be used from a server.",
      },
    },
  },
  commandRun: {
    unhandledException: {
      forOwner: () =>
        "I ran into an unhandled exception:",
      forUser: ({owner}) =>
        `I'm sorry, but there was an unexpected problem while I was working on that command. ` +
        `I have notified my owner, ${owner.username}, about it and hopefully they will ` +
        `be able to fix it.`,
    },
  },
};

module.exports = defaultResponseStrings;
