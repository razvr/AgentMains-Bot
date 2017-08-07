const RandomReplyCommand = require('../random-reply-command');

let MarryCommand = new RandomReplyCommand({
  name: 'marryme',
  description: 'Ask me to marry you. I\'ll probably just say no though.',
  showInHelp: false,
  messages: [
    "I'm sorry, but I don't feel the same way.",
    "I like you, but I don't \"like\" like you.",
    "Can we just stay friends?",
    "I don't think we would be a good fit.",
    "I have a boyfriend.",
    "I have a girlfriend.",
    "I don't want to commit to anything right now.",
  ],
});
module.exports = MarryCommand;
