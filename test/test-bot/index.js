'use strict';
const Nix = require('../../lib/chaos-core');
const config = require('../../config.js');

let chaos = new Nix(config);
chaos.addModule(require('./dummy-module'));
chaos.listen();
