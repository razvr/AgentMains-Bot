v4.0.1-dev
====

Breaking Changes
--------------
- Upgrade to RxJS 6
- Moved discord and chaos mocks to `ChaosCore.test`
    - `const {MockGuild} = require('chaos-core').test.discordMocks`
    - `const {MockCommand} = require('chaos-core').test.chaosMocks`
- Removed Mockery from chaos mocks
- Removed `services` and `commands` from config
    - add new services and commands through plugins
- Removed chaos from commandContext
    - replace calls to `context.chaos` with `this.chaos`
- Deprecated `onListen` and `onJoinGuild`
    - use new event system
    
Major Features
--------------
- Event system
    - Listeners and handlers can be added to events emitted by ChaosCore
    - See [docs/developers/events.md](./docs/developers/events.md) for details
- `this.logger` added to ChaosComponents
    - `Plugin`, `Command`, `ConfigAction`, `Service` now have easy access to
      chaos' logger.

Minor Features
--------------
- added chaos.notifyError and chaos.catchError operators
    - chaos.notifyError will notify the bot owner of an error, and rethrow it
    - chaos.catchError will also notify, but will silence the error
- added testCmdMessage to stubbed Chaos bots
    - emits {context, response} when the bot has finished handling the message
    - currently only works with messages that contain commands
- added .replies to command Responses
    - records all sent replies for the command

Bug Fixes
---------
- Fix `RoleService.findRole` not matching basic role mentions 