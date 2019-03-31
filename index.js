module.exports = require('./lib/nix-core');
module.exports.NixConfig = require('./lib/models/nix-config');
module.exports.Module = require('./lib/models/module');
module.exports.Service = require('./lib/models/service');
module.exports.Command = require('./lib/models/command');
module.exports.ConfigAction = require('./lib/models/config-action');

module.exports.test = {
  createNixStub: require('./test/support/create-nix-stub'),
};
