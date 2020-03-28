module.exports = {
  hasBeenDisabled: ({ commandName }) =>
    `Command \`${commandName}\` has been disabled.`,
  unableToDisable: ({ commandName }) =>
    `Unable to disable \`${commandName}\`.`,
};
