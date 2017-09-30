const defaultResponseStrings = {
  commandParsing: {
    error: {
      missingArgument: "I'm sorry, but I'm missing some information for that command:",
      wrongScope: {
        general: "I'm sorry, but that command isn't available here.",
        textChannelOnly: "I'm sorry, but that command can only be used from a server.",
      },
    },
  },
};

module.exports = defaultResponseStrings;
