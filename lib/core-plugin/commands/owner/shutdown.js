const { flatMap } = require('rxjs/operators');

module.exports = {
  name: 'shutdown',
  description: 'Shutdown',
  ownerOnly: true,

  run(context, response) {
    let strings = this.chaos.strings.core.commands.owner.shutdown;
    return response.send({ content: strings.shuttingDown() }).pipe(
      flatMap(() => this.chaos.shutdown()),
    );
  },
};
