const Rx = require('rx');

module.exports = {
  addModLogEntry(context, embed) {
    return context.nix.data
      .getGuildData(context.guild.id, 'modTools.modLogChannel')
      .map((channelId) => context.guild.channels.find("id", channelId))
      .flatMap((channel) => {
        if(channel) {
          return Rx.Observable.fromPromise(channel.send({embed}));
        }
        else {
          return Rx.Observable.return();
        }
      });
  },
};
