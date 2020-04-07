module.exports = {
  name: 'shutdown',
  description: 'Shutdown',
  ownerOnly: true,

  async run(context, response) {
    let strings = this.chaos.strings.core.commands.owner.shutdown;
    await response.send({ content: strings.shuttingDown() }).toPromise();
    await this.chaos.shutdown().toPromise();
  }
}
