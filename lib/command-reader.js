class CommandReader {
  constructor () {
    this._commands = {};
  }

  get commands () {
    return this._commands;
  }

  addCommand(command) {
    console.log("adding command", command.name);
    this._commands[command.name] = command;
  }

  msgIsCommand(message) {
    if (message.content.indexOf('!') !== 0) {
      return false;
    }

    let commandName = message.content.split(' ')[0].slice(1);
    return typeof this.commands[commandName] !== 'undefined';
  }
}



module.exports = CommandReader;
