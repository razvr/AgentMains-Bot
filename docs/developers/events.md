Events
======

A ChaosCore bot will emit events during the lifecycle of the bot.

You can listen and handle these events by calling `chaos.on('event', handler)`. 
Additionally, you can use `event:before` or `event:after` to run code before 
or after an event respectfully. All handlers for each stage will be run before 
the next stage starts.

You can emit your own events, or emit existing events for testing, with 
`chaos.emit('event', payload)`. `.emit` returns an Observable that can be 
subscribed to run additional code after all event listener have finished.

example:
```js
chaos.on('event', () => console.log('normal event'));
chaos.on('event:before', () => console.log('event'));
chaos.on('event:after', () => console.log('after event'));

chaos.emit('event');

//console:
// => before event
// => event
// => after event
```



Discord Events
--------------

The bot will emit any events emitted by `Discord.js`. See the [Discord Client]
for a list of all events.

**Special note:** Discord.js's `guildCreate` event will also be emitted when the
bot starts listening for each guild that the bot is already in. This is to allow
plugins to set up information for guilds that the bot was added to while it was 
offline. 



Chaos Events
------------

The current list of ChaosCore specific events are:

| event          | payload  | description                                |
|----------------|----------|--------------------------------------------|
| chaos.startup  |          | Emitted when the bot is starting           |
| chaos.listen   |          | Emitted when the bot has started to listen |
| chaos.ready    |          | Emitted when the bot has finished startup  |
| chaos.command  | Message  | Emitted when a message has a valid command |
| chaos.response | Response | Emitted when a command makes a response    |
| chaos.shutdown |          | Emitted when the bot is shutting down      |

If you have tasks that need to be run as soon as possible when starting to 
listen (eg. binding services, connecting to the database) you can add a listener
to `chaos.startup`.


[Discord Client]: https://discord.js.org/#/docs/main/stable/class/Client

