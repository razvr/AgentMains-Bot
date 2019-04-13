const ChaosCore = require('../lib/chaos-core');
const mocks = require('./mocks');

module.exports = (config = {}) => {
  let chaos = new ChaosCore({
    ownerUserId: '100000000',
    loginToken: 'example-token',

    logger: { level: 'warn' },
    dataSource: { type: 'memory' },

    ...config,
  });

  chaos.stubService = (moduleName, serviceName, service) => {
    let serviceKey = `${moduleName}.${serviceName}`.toLowerCase();
    chaos.servicesManager._services[serviceKey] = service;
  };

  chaos.handleError = (error) => {
    return new Promise((resolve, reject) => reject(error));
  };

  chaos.discord.user = mocks.discord.build('User', {
    id: chaos.config.ownerUserId,
  });

  chaos.discord.login = () => {
    return new Promise((resolve) =>
      resolve(chaos.discord.user),
    );
  };
  chaos.discord.fetchUser = (id) => {
    return new Promise((resolve) =>
      resolve(mocks.discord.build('User', { id })),
    );
  };
  chaos.discord.destroy = () => {
    return new Promise((resolve) => resolve());
  };

  return chaos;
};
