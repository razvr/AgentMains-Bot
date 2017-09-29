const Rx = require('rx');

class Response {
  constructor(type, content = '', embed = null) {
    this.type = type;
    this.content = content;
    this.embed = embed;
  }

  /**
   * Sends this response in the specified format
   *
   * @param message {Message} The message to reply to
   *
   * @return {Observable}
   */
  respondTo(message) {
    switch (this.type) {
      case Response.TYPE_NONE:
        return Rx.Observable.empty();
      case Response.TYPE_REPLY:
        return Rx.Observable.fromPromise(message.reply(this.content));
      case Response.TYPE_MESSAGE:
        return Rx.Observable.fromPromise(message.channel.send(this.content));
      case Response.TYPE_EMBED:
        return Rx.Observable.fromPromise(message.channel.send(this.content, {embed: this.embed}));
      case Response.TYPE_DM:
        return Rx.Observable.fromPromise(message.author.send(this.content));
      default:
        return Rx.Observable.throw('Unknown response type ' + this.type);
    }
  }
}

Response.TYPE_NONE = 'none';
Response.TYPE_REPLY = 'reply';
Response.TYPE_MESSAGE = 'message';
Response.TYPE_EMBED = 'embed';
Response.TYPE_DM = 'dm';

module.exports = Response;
