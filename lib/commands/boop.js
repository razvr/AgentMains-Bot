const RandomReplyCommand = require('../random-reply-command');

let BoopCommand = new RandomReplyCommand({
  name: 'boop',
  description: 'Boop~',
  showInHelp: false,
  messages: [
    ':boop: Boop!',
    'Boop?',
    'Boop :cute:',
    ':boop:',
  ],
});

module.exports = BoopCommand;
