const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const glob = require('glob');
const path = require('path');

const observableMatchers = require('./support/observable-matchers');
const Mockery = require('./support/mockery');
const createNixStub = require('./support/create-nix-stub');

chai.use(sinonChai);
chai.use(observableMatchers);

global.sinon = sinon;
global.expect = chai.expect;

global.stub = sinon.stub;
global.spy = sinon.spy;
global.fake = sinon.fake;
global.mock = sinon.mock;

global.Mockery = Mockery;
global.createNixStub = createNixStub;

let factoriesDir = path.join(__dirname, 'factories');
glob.sync('**/*.factory.js', { cwd: factoriesDir })
  .map((filename) => path.join(factoriesDir, filename))
  .forEach((filepath) => require(filepath));
