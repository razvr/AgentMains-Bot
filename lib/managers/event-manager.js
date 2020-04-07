const { fromEvent } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const Discord = require('discord.js');

const ChaosManager = require('../models/chaos-manager');
const { asPromise } = require('../utility');

class EventManager extends ChaosManager {
  constructor(chaos) {
    super(chaos);
    this._eventHandlers = {};

    this.registerEvent = this.registerEvent.bind(this);
    this.on = this.on.bind(this);
    this.emit = this.emit.bind(this);

    this.registerEvent('chaos.listen');
    this.registerEvent('chaos.ready');
    Object.values(Discord.Constants.Events).forEach((event) => {
      this.registerEvent(event);
      fromEvent(chaos.discord, event, (...args) => args.length > 1 ? args : args[0])
        .pipe(flatMap((payload) => this.emit(event, payload)))
        .subscribe();
    });
  }

  registerEvent(event) {
    if (this._eventHandlers[event.toLowerCase()]) return;

    const handlers = [];
    handlers.before = [];
    handlers.after = [];
    this._eventHandlers[event.toLowerCase()] = handlers;

    this.chaos.logger.debug(`Registered event ${event}`);
  }

  getEventHandlers(event) {
    this.registerEvent(event);
    return this._eventHandlers[event.toLowerCase()];
  }

  on(event, handler) {
    let [eventName, stage] = event.toLowerCase().split(':');

    const handlers = this.getEventHandlers(eventName);
    switch (stage) {
      case "before":
        return handlers.before.push(handler);
      case "after":
        return handlers.after.push(handler);
      default:
        return handlers.push(handler);

    }
  }

  async emit(event, payload) {
    const eventHandlers = this.getEventHandlers(event);

    const runHandlers = (handlers) => {
      return Promise.all(handlers.map((handler) => asPromise(handler(payload))));
    };

    try {
      this.chaos.logger.verbose(`running event ${event}`);

      this.chaos.logger.debug(`running before event ${event} handlers`);
      await runHandlers(eventHandlers.before);

      this.chaos.logger.debug(`running event ${event} handlers`);
      await runHandlers(eventHandlers);

      this.chaos.logger.debug(`running after event ${event} handlers`);
      await runHandlers(eventHandlers.after);

      this.chaos.logger.verbose(`event ${event} complete`);
    } catch (error) {
      await this.chaos.handleError(error, [
        { name: "Event handler", value: event },
      ]);
    }
  }
}

module.exports = EventManager;
