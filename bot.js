'use strict';
const Nix = require('./nix-core');
const config = require('./config/config.js');

let nix = new Nix(config);
nix.listen().subscribe();
