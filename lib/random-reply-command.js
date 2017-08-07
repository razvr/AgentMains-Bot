const Rx = require('rx');

const Command = require('./command');
const Response = require('./response');

class RandomReplyCommand extends Command {
  constructor(options) {
    super(options);

    this._messages = options.messages;

    this.run = (context) => {
      let response = new Response(Response.TYPE_MESSAGE);

      let boopMsg = this._randomMessage()
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
    };

  }

  _randomMessage() {
    return this._messages[Math.floor(Math.random() * this._messages.length)];
  }
}

function findEmoji(context, emojiName) {
  emojiName = emojiName.toLowerCase();
  let emojis = context.guild.emojis;

  return emojis.find((emoji) => emoji.name.toLowerCase() === emojiName);
}

module.exports = RandomReplyCommand;
