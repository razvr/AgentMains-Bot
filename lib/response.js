const Rx = require('rx');
const Discord = require('discord.js');

class Response {
  constructor(type, content='') {
    this.type = type;
    this.content = content;
    this.embed = new Discord.RichEmbed();

    this.deleteCmd = false;
  }

  respondTo(message) {
    return Rx.Observable.merge(
      this._reply(message),
      this._deleteCommand(message),
    );
  }

  _reply(message) {
    switch (this.type) {
      case Response.TYPE_NONE: return Rx.Observable.empty();
      case Response.TYPE_REPLY: return message.reply(this.content);
      case Response.TYPE_MESSAGE: return message.channel.send(this.content);
      case Response.TYPE_EMBED: return message.channel.send(this.content, {embed: this.embed});
      case Response.TYPE_DM: return message.author.send(this.content);
      default: return Rx.Observable.throw('Unknown response type ' + this.type)
    }
  }

  _deleteCommand(message) {
    if(this.deleteCmd && message.channel.type === 'text') {
      return Rx.Observable.fromPromise(message.delete());
    } else {
      return Rx.Observable.empty();
    }
  }
}

Response.TYPE_NONE = 'none';
Response.TYPE_REPLY = 'reply';
Response.TYPE_MESSAGE = 'message';
Response.TYPE_EMBED = 'embed';
Response.TYPE_DM = 'dm';

module.exports = Response;
