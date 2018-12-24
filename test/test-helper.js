const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const glob = require('glob');
const path = require('path');

const observableMatchers = require('./observable-matchers');
const Mockery = require('./support/mockery');
const NixCore = require('../index');

chai.use(sinonChai);
chai.use(observableMatchers);

global.sinon = sinon;
global.expect = chai.expect;

global.stub = sinon.stub;
global.spy = sinon.spy;
global.fake = sinon.fake;
global.mock = sinon.mock;

global.Mockery = Mockery;

let factoriesDir = path.join(__dirname, 'factories');
glob.sync('**/*.factory.js', { cwd: factoriesDir })
  .map((filename) => path.join(factoriesDir, filename))
  .forEach((filepath) => require(filepath));

global.createNixStub = () => {
  let nix = new NixCore({
    ownerUserId: 'user-00001',
    loginToken: 'example-token',
  });

  nix.stubService = (moduleName, serviceName, service) => {
    let serviceKey = `${moduleName}.${serviceName}`.toLowerCase();
    nix.servicesManager._services[serviceKey] = service;
  };

  sinon.stub(nix, 'handleError').callsFake((error) => { throw error; });

  return nix;
};

