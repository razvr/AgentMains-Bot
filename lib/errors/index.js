const PermissionLevelErrors = require('./permission-level-errors');
const PluginManagerErrors = require('./plugin-errors');
const ChaosErrors = require("./chaos-errors");
const UserErrors = require("./user-errors");
const CommandErrors = require("./command-errors");
const RoleErrors = require("./role-errors");

module.exports = {
  ...ChaosErrors,
  ...PermissionLevelErrors,
  ...PluginManagerErrors,
  ...UserErrors,
  ...CommandErrors,
  ...RoleErrors,
};
