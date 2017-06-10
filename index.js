'use strict';
const fs = require('fs');
const Discord = require('discord.js');

const Nix = require('./lib/nix');
const cfg = require('./config.js');

const discordClient = new Discord.Client();

let nix = new Nix(discordClient, cfg);

// Load every command in the commands folder
fs.readdirSync('./lib/commands')
  .forEach(file => {
    nix.addCommand(require('./lib/commands/' + file));
  });

nix.listen()
  .subscribe(
    () => {},
    (error) => onNixError(error),
    () => onNixComplete()
);

function onNixError(error) {
  console.error(error);
  nix.messageOwner('Shutting down due to unhandled error: ' + error)
    .subscribe(
      () => {},
      () => {},
      () => process.exit(1)
    );
}

function onNixComplete() {
  console.log('Shutting down');
  nix.messageOwner('Nix shutting down')
    .subscribe(
      () => {},
      () => {},
      () => process.exit(0)
    );
}
