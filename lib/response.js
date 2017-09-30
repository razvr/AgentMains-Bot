const Rx = require('rx');
const Discord = require('discord.js');

class Response {
  constructor(message, type = 'message', content = '', embed = null) {
    this._message = message;

    this.type = type;
    this.content = content;
    this._embed = embed;
  }

  get embed() {
    if (!this._embed) {
      this._embed = new Discord.MessageEmbed();
      return this._embed;
    }
    else if (this._embed instanceof Discord.MessageEmbed) {
      return this._embed;
    }
    else {
      this._embed = new Discord.MessageEmbed(this._embed);
      return this._embed;
    }
  }

  set embed(value) {
    this._embed = value;
  }

  /**
   * Sends this response in the specified format
   *
   * @return {Observable}
   */
  send() {
    switch (this.type) {
      case 'none':
        return Rx.Observable.empty();
      case 'reply':
        return Rx.Observable.fromPromise(this._message.reply(this.content));
      case 'message':
        return Rx.Observable.fromPromise(this._message.channel.send(this.content));
      case 'embed':
        return Rx.Observable.fromPromise(this._message.channel.send(this.content, { embed: this.embed }));
      case 'dm':
        return Rx.Observable.fromPromise(this._message.author.send(this.content));
      default:
        return Rx.Observable.throw('Unknown response type ' + this.type);
    }
  }
}

module.exports = Response;
