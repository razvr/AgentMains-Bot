const { from, zip, of } = require('rxjs');
const { tap, flatMap, map, toArray, defaultIfEmpty } = require('rxjs/operators');

const { toObservable } = require('../utility');

class EventManager {
  constructor(chaos) {
    this._chaos = chaos;

    this._eventHandlers = {};
  }

  registerEvent(event) {
    if (this._eventHandlers[event]) {
      throw new Error(`Event ${event} already registered`);
    }

    const handlers = [];
    handlers.before = [];
    handlers.after = [];
    this._eventHandlers[event] = handlers;
  }

  getEventHandlers(event) {
    if (!this._eventHandlers[event]) {
      throw new Error(`Event ${event} not registered`);
    }

    return this._eventHandlers[event];
  }

  addEventHandler(event, handler) {
    let [eventName, stage] = event.split(':');

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

  triggerEvent(event, payload) {
    const eventHandlers = this.getEventHandlers(event);

    const runHandlers = (handlers) => {
      return flatMap(() => from(handlers).pipe(
        map((handler) => toObservable(handler(payload))),
        toArray(),
        flatMap((handlers) => zip(...handlers)),
        defaultIfEmpty(''),
      ));
    };

    return of('').pipe(
      tap(() => this._chaos.logger.debug(`running before event ${event} handlers`)),
      runHandlers(eventHandlers.before),
      tap(() => this._chaos.logger.debug(`running event ${event} handlers`)),
      runHandlers(eventHandlers),
      tap(() => this._chaos.logger.debug(`running after event ${event} handlers`)),
      runHandlers(eventHandlers.after),
    );
  }
}

module.exports = EventManager;