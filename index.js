module.exports = require('./lib/nix-core');
module.exports.errror = require('./lib/errors');

module.exports.NixConfig = require('./lib/models/nix-config');
module.exports.Plugin = require('./lib/models/plugin');
module.exports.Service = require('./lib/models/service');
module.exports.Command = require('./lib/models/command');
module.exports.ConfigAction = require('./lib/models/config-action');

module.exports.utility = require('./lib/utility');
