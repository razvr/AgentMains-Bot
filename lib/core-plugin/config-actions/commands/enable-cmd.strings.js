module.exports = {
  hasBeenEnabled: ({ commandName }) =>
    `Command \`${commandName}\` has been enabled.`,
  unableToEnable: ({ commandName }) =>
    `Unable to enable \`${commandName}\`.`,
};
