const ChaosCore = require('../lib/chaos-core');
const stubChaosBot = require('./stub-chaos-bot');

module.exports = (config = {}) => {
  return stubChaosBot(new ChaosCore({
    ownerUserId: '100000000',
    loginToken: 'example-token',

    logger: { level: 'warn' },
    dataSource: { type: 'memory' },

    ...config,
  }));
};
