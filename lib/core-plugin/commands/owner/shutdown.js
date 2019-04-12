module.exports = {
  name: 'shutdown',
  description: 'Shutdown',
  ownerOnly: true,

  run(context, response) {
    return response
      .send({content: "Ok, shutting down now."})
      .map(() => this.chaos.shutdown());
  },
};
