const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

let BoopCommand = new Command({
  name: 'boop',
  description: 'Boop~',

  run (context) {
    let response = new Response(Response.TYPE_MESSAGE);

    let boopMsg = randomMessage()
      .replace(/:(\w\w+):/, (match, emojiName) => {
        if (context.guild) {
          let foundEmoji = findEmoji(context, emojiName);
          return foundEmoji ? foundEmoji.toString() : '';
        } else {
          return '';
        }
      })
      .trim();

    if (boopMsg === '') {
      return this.run(context);
    }

    response.content = boopMsg;
    return Rx.Observable.just(response);
  },
});

let boopMessages = [
  ':boop: Boop!',
  'Boop? :thinkbra:',
  'Boop :cute:',
  ':boop:',
];

function randomMessage() {
  return boopMessages[Math.floor(Math.random() * boopMessages.length)];
}

function findEmoji(context, emojiName) {
  let emojis = context.guild.emojis;
  return emojis.find((emoji) => emoji.name === emojiName);
}

module.exports = BoopCommand;
