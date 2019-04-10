'use strict';
const Nix = require('../../lib/nix-core');
const config = require('../../config.js');

let nix = new Nix(config);
nix.addPlugin(require('./dummy-module'));
nix.listen();
