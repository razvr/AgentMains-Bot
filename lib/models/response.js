const { from, EMPTY, throwError } = require('rxjs');

const Discord = require('discord.js');

class Response {
  constructor(message, type = 'message', content = '', embed = null) {
    this._message = message;

    this.type = type;
    this.content = content;
    this._embed = embed;

    this._replies = [];
  }

  get replies() {
    return this._replies;
  }

  get embed() {
    if (!this._embed) {
      this._embed = new Discord.RichEmbed();
      return this._embed;
    } else if (this._embed instanceof Discord.RichEmbed) {
      return this._embed;
    } else {
      this._embed = new Discord.RichEmbed(this._embed);
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
  send(data) {
    if (data) {
      if (data.type) {this.type = data.type;}
      if (data.content) {this.content = data.content;}
      if (data.embed) {
        this.type = 'embed';
        this.embed = data.embed;
      }
    }

    if (this.type === "none") {
      return EMPTY;
    }

    this._replies.push({
      type: this.type,
      content: this.content,
      embed: this._embed,
    });

    switch (this.type) {
      case 'reply':
        return from(this._message.reply(this.content));
      case 'message':
        return from(this._message.channel.send(this.content));
      case 'embed':
        return from(this._message.channel.send(this.content, { embed: this.embed }));
      case 'dm':
        return from(this._message.author.send(this.content));
      default:
        return throwError('Unknown response type ' + this.type);
    }
  }
}

module.exports = Response;
