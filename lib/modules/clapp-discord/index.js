"use strict";

const Clapp = require('clapp');
const App = require('./clapp-app');
const Command = require('./clapp-command');

module.exports = {
  App: App,
  Argument: Clapp.Argument,
  Command: Command,
  Flag: Clapp.Flag
};
