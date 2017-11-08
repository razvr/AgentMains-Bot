const defaultResponseStrings = {
  commandParsing: {
    error: {
      missingArgument: (locals) =>
        "I'm sorry, but I'm missing some information for that command:",
      wrongScope: {
        general: (locals) =>
          "I'm sorry, but that command isn't available here.",
        textChannelOnly: (locals) =>
          "I'm sorry, but that command can only be used from a server.",
      },
    },
  },
  commandRun: {
    unhandledException: {
      forOwner: (locals) =>
        "I ran into an unhandled exception: ",
      forUser: (locals) =>
        `I'm sorry, but there was an unexpected problem while I was working on that command. ` +
        `I have notified my owner, ${locals.owner.username}, about it and hopefully they will ` +
        `be able to fix it.`,
      },
    },
  },
};

module.exports = defaultResponseStrings;
