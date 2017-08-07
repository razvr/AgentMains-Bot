class CommandContext {
  get nix() {
    return this._nix;
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

  get guild() {
    return this._message.guild;
  }

  get member() {
    return this._message.member;
  }

  get channel() {
    return this._message.channel;
  }

  constructor(message, args, flags, nix) {
    this._message = message;
    this._args = args;
    this._flags = flags;
    this._nix = nix;
  }

  hasFlag(flagName) {
    return (typeof this.flags[flagName] !== "undefined");
  }
}

module.exports = CommandContext;
