const RandomReplyCommand = require('../random-reply-command');

let BoopCommand = new RandomReplyCommand({
  name: 'boop',
  description: 'Boop~',
  messages: [
    ':boop: Boop!',
    'Boop? :thinkbra:',
    'Boop :cute:',
    ':boop:',
  ],
});

module.exports = BoopCommand;
