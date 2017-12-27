'use strict';
const Nix = require('./nix-core');
const config = require('./test/config.js');

let nix = new Nix(config);
nix.listen().subscribe();
