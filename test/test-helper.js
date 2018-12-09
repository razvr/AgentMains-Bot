let chai = require("chai");
let sinon = require("sinon");
let sinonChai = require("sinon-chai");

chai.use(sinonChai);

global.sinon = sinon;
global.expect = chai.expect;
