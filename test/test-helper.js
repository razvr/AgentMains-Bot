const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

const observableMatchers = require('./support/observable-matchers');

chai.use(sinonChai);
chai.use(observableMatchers);

global.sinon = sinon;
global.expect = chai.expect;
