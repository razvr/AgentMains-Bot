const NixCore = require('../../index');
const Mockery = require('./mockery');

module.exports = (config = {}) => {
  let nix = new NixCore({
    ownerUserId: '100000000',
    loginToken: 'example-token',

    logger: { level: 'warn' },
    dataSource: { type: 'memory' },

    ...config,
  });

  nix.stubService = (pluginName, serviceName, service) => {
    let serviceKey = `${pluginName}.${serviceName}`.toLowerCase();
    nix.servicesManager._services[serviceKey] = service;
  };

  nix.handleError = (error) => {
    return new Promise((resolve, reject) => reject(error));
  };

  nix.discord.user = Mockery.create('User', {
    id: nix.config.ownerUserId,
  });

  nix.discord.login = () => {
    return new Promise((resolve) =>
      resolve(nix.discord.user),
    );
  };
  nix.discord.fetchUser = (id) => {
    return new Promise((resolve) =>
      resolve(Mockery.create('User', { id })),
    );
  };
  nix.discord.destroy = () => {
    return new Promise((resolve) => resolve());
  };

  return nix;
};
