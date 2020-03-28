const Command = require('./../../../models/command');
const { flatMap } = require('rxjs/operators');

class ShutdownCommand extends Command {
  name = 'owner:shutdown';
  description = 'Shutdown';
  ownerOnly = true;

  run(context, response) {
    let strings = this.chaos.strings.core.commands.owner.shutdown;
    return response.send({ content: strings.shuttingDown() }).pipe(
      flatMap(() => this.chaos.shutdown()),
    );
  }
}

module.exports = ShutdownCommand;
