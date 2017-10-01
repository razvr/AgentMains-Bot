const defaultResponseStrings = {
  commandParsing: {
    error: {
      missingArgument:
        "I'm sorry, but I'm missing some information for that command:",
      wrongScope: {
        general:
          "I'm sorry, but that command isn't available here.",
        textChannelOnly:
          "I'm sorry, but that command can only be used from a server.",
      },
    },
  },
  commandRun: {
    unhandledException: {
      forOwner:
        "I ran into an unhandled exception: ",
      forUser:
        "I'm sorry, but an unexpected problem while I was working on that command. I have notified my owner about it.",
    },
  },
};

module.exports = defaultResponseStrings;
