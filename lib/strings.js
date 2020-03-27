const defaultStrings = {
  core: {
    commands: {
      owner: {
        listGuilds: {
          inGuilds: () =>
            `I'm in the following guilds:`,
        },
        shutdown: {
          shuttingDown: () =>
            `Ok, shutting down now.`,
        },
      },
      config: {
        pluginList: () =>
          `Here's a list of plugins with config actions:`,
        actionList: ({ pluginName }) =>
          `Here's a list of config actions for ${pluginName}:`,
        pluginNotFound: ({ pluginName, prefix }) =>
          `There is no plugin "${pluginName}".\n` +
          `You can use \`${prefix}config --list\` to see a list of all config actions.`,
        pluginNotEnabled: ({ pluginName, prefix }) =>
          `The plugin "${pluginName}" is currently disabled.\n` +
          `You can use \`${prefix}config core enablePlugin ${pluginName}\` to enable it.`,
        actionNotFound: ({ pluginName, actionName, prefix }) =>
          `There is no config action "${pluginName} ${actionName}".\n` +
          `You can use \`${prefix}config ${pluginName} --list\` to see a list of all config actions.`,
      },
    },
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
      forUser: ({ owner }) =>
        `I'm sorry, but there was an unexpected problem while I was working on that command. ` +
        `I have notified my owner, ${owner.username} (${owner}), about it and hopefully they will ` +
        `be able to fix it.`,
    },
  },
};

module.exports = defaultStrings;
