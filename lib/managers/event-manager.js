const { from, zip, of, ReplaySubject } = require('rxjs');
const { tap, flatMap, map, toArray, defaultIfEmpty } = require('rxjs/operators');

const { toObservable } = require('../utility');

class EventManager {
  constructor(chaos) {
    this._chaos = chaos;
    this._eventHandlers = {};

    this.addEventListener = this.addEventListener.bind(this);
    this.registerEvent = this.registerEvent.bind(this);
    this.triggerEvent = this.triggerEvent.bind(this);
  }

  get chaos() {
    return this._chaos;
  }

  registerEvent(event) {
    if (this._eventHandlers[event]) return;

    const handlers = [];
    handlers.before = [];
    handlers.after = [];
    this._eventHandlers[event] = handlers;

    this.chaos.logger.debug(`Registered event ${event}`);
  }

  getEventHandlers(event) {
    this.registerEvent(event);
    return this._eventHandlers[event.toLowerCase()];
  }

  addEventListener(event, handler) {
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

  triggerEvent(event, payload) {
    const eventHandlers = this.getEventHandlers(event);

    const runHandlers = (handlers) => {
      return flatMap(() => from(handlers).pipe(
        map((handler) => toObservable(handler(payload)).pipe(
          this.chaos.catchError([
            { name: "Event handler", value: event },
          ]),
          toArray(),
        )),
        toArray(),
        flatMap((handlers) => zip(...handlers)),
        defaultIfEmpty([]),
      ));
    };

    const doneSubject = new ReplaySubject();

    of('').pipe(
      tap(() => this.chaos.logger.verbose(`running event ${event}`)),
      tap(() => this.chaos.logger.debug(`running before event ${event} handlers`)),
      runHandlers(eventHandlers.before),
      tap(() => this.chaos.logger.debug(`running event ${event} handlers`)),
      runHandlers(eventHandlers),
      tap(() => this.chaos.logger.debug(`running after event ${event} handlers`)),
      runHandlers(eventHandlers.after),
      tap(() => this.chaos.logger.verbose(`event ${event} complete`)),
    ).subscribe(
      () => doneSubject.next(''),
      (error) => doneSubject.error(error),
      () => doneSubject.complete(),
    );

    return doneSubject;
  }
}

module.exports = EventManager;