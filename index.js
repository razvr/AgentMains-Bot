module.exports = require('./lib/chaos-core');

module.exports.ChaosConfig = require('./lib/models/chaos-config');
module.exports.Plugin = require('./lib/models/plugin');
module.exports.Service = require('./lib/models/service');
module.exports.Command = require('./lib/models/command');
module.exports.ConfigAction = require('./lib/models/config-action');

module.exports.utility = require('./lib/utility');

module.exports.test = {
  discordMocks: require('./test/mocks/discord.mocks'),
  chaosMocks: require('./test/mocks/chaos.mocks'),
  stubChaosBot: require('./test/stub-chaos-bot'),
  createChaosStub: require('./test/create-chaos-stub'),
};
