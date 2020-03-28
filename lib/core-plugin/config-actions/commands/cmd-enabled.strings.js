module.exports = {
  isEnabled: ({ commandName }) =>
    `Command \`${commandName}\` is enabled.`,
  isDisabled: ({ commandName }) =>
    `Command \`${commandName}\` is disabled.`,
};
