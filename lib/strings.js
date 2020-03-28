const defaultStrings = {
  core: require('./core-plugin/index.strings'),
  commandParsing: {
    help: () =>
      "Here's how to use that command:",
    error: {
      missingArgument: () =>
        "I'm sorry, but I'm missing some information for that command:",
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
