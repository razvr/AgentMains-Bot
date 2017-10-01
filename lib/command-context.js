const Response = require('./response');

class CommandContext {
  get nix() {
    return this._nix;
  }

  get dataManager() {
    return this.nix.dataManager;
  }

  get args() {
    return this._args;
  }

  get flags() {
    return this._flags;
  }

  get message() {
    return this._message;
  }

  get response() {
    return this._response;
  }

  get guild() {
    return this.message.guild;
  }

  get author() {
    return this.message.author;
  }

  get member() {
    return this.message.member;
  }

  get user() {
    if (this.member) {
      return this.member.user;
    }
    else if (this.author) {
      return this.author;
    }
    else {
      return null;
    }
  }


  get channel() {
    return this.message.channel;
  }

  /**
   *
   * @param message
   * @param args
   * @param flags
   * @param nix {Nix}
   */
  constructor(message, args, flags, nix) {
    this._message = message;
    this._args = args;
    this._flags = flags;
    this._nix = nix;
    this._response = new Response(message);
  }

  hasFlag(flagName) {
    return (typeof this.flags[flagName] !== "undefined");
  }
}

module.exports = CommandContext;
