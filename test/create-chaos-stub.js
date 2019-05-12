const { ReplaySubject } = require('rxjs');
const { take, tap } = require('rxjs/operators');

const ChaosCore = require('../lib/chaos-core');
const stubChaosBot = require('./stub-chaos-bot');

const createChaosStub = (config = {}) => {
  const chaos = stubChaosBot(new ChaosCore({
    ownerUserId: '100000000',
    loginToken: 'example-token',

    logger: { level: 'warn' },
    dataSource: { type: 'memory' },

    ...config,
  }));

  chaos.testCmdMessage = (message) => {
    const responses = new ReplaySubject();

    chaos.streams.postCommand$.pipe(
      take(1),
      tap(({ response }) => chaos.logger.debug(`${response.replies} replies for message '${message.context}'`)),
    ).subscribe(
      (data) => responses.next(data),
      (error) => responses.error(error),
      () => responses.complete(),
    );

    chaos.discord.emit('message', message);

    return responses;
  };

  return chaos;
};

module.exports = createChaosStub;