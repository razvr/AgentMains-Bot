const { flatMap } = require('rxjs/operators');

module.exports = {
  name: 'shutdown',
  description: 'Shutdown',
  ownerOnly: true,

  run(context, response) {
    return response.send({ content: "Ok, shutting down now." }).pipe(
      flatMap(() => this.chaos.shutdown()),
    );
  },
};
