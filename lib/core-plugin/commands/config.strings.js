module.exports = {
  pluginList: () =>
    `Here's a list of plugins with config actions:`,
  actionList: ({ pluginName }) =>
    `Here's a list of config actions for ${pluginName}:`,
  pluginNotFound: ({ pluginName, prefix }) =>
    `There is no plugin "${pluginName}".\n` +
    `You can use \`${prefix}config --list\` to see a list of all config ` +
    `actions.`,
  pluginNotEnabled: ({ pluginName, prefix }) =>
    `The plugin "${pluginName}" is currently disabled.\n` +
    `You can use \`${prefix}config core enablePlugin ${pluginName}\` to ` +
    `enable it.`,
  actionNotFound: ({ pluginName, actionName, prefix }) =>
    `There is no config action "${pluginName} ${actionName}".\n` +
    `You can use \`${prefix}config ${pluginName} --list\` to see a list ` +
    `of all config actions.`,
};
