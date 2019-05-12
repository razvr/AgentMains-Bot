const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiSubset = require("chai-subset");

chai.use(sinonChai);
chai.use(chaiSubset);

global.sinon = sinon;
global.expect = chai.expect;
