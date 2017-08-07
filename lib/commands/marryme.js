const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

let MarryCommand = new Command({
  name: 'marryme',
  description: 'Ask me to marry you. I\'ll probably just say no though.',

  run(context) {
    let response = new Response(Response.TYPE_MESSAGE);

    let message = randomMessage()
      .replace(/:(\w\w+):/, (match, emojiName) => {
        if (context.guild) {
          let foundEmoji = findEmoji(context, emojiName);
          return foundEmoji ? foundEmoji.toString() : '';
        } else {
          return '';
        }
      })
      .trim();

    //if the message contained just invalid emoji, rerun the command
    if (message === '') {
      return this.run(context);
    }

    response.content = message;
    return Rx.Observable.just(response);
  },
});

let messages = [
  "I'm sorry, but I don't feel the same way.",
  "I like you, but I don't \"like\" like you.",
  "Can we just stay friends?",
  "I don't think we would be a good fit.",
  "I have a boyfriend.",
  "I have a girlfriend.",
  "I don't want to commit to anything right now.",
];

function randomMessage() {
  return messages[Math.floor(Math.random() * messages.length)];
}

function findEmoji(context, emojiName) {
  emojiName = emojiName.toLowerCase();
  let emojis = context.guild.emojis;

  return emojis.find((emoji) => emoji.name.toLowerCase() === emojiName);
}

module.exports = MarryCommand;
