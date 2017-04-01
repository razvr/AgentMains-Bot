const Clapp = require('../modules/clapp-discord');
const utilties = require('../utlities');

module.exports = new Clapp.Command({
  name: "boop",
  desc: "Boop",
  fn: (argv, context) => {
    let message = utilties.getRandomResponse('boop');

    let guildEmoji = context.msg.guild.emojis;
    let boopEmoji = guildEmoji.find(emoji => emoji.name.toLowerCase() === 'boop');

    if (boopEmoji) {
      message = boopEmoji.toString() + ' ' + message;
    }

    return {
      message: {
        type: 'message',
        message: message,
      },
      context: context,
    }
  },
});
