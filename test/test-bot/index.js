'use strict';
const Nix = require('../../lib/chaos-core');
const config = require('../../config.js');

let nix = new Nix(config);
nix.addPlugin(require('./dummy-module'));
nix.listen();
