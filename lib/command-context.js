class CommandContext {
  get nix() {
    return this._nix;
  }

  get args() {
    return this._args;
  }

  get message() {
    return this._message;
  }

  get guild() {
    return this._message.guild;
  }

  get member() {
    return this._message.member;
  }

  get channel() {
    return this._message.channel;
  }

  constructor(message, args, nix) {
    this._message = message;
    this._args = args;
    this._nix = nix;
  }
}

module.exports = CommandContext;
