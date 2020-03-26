v5.0.0
======

Breaking Changes
----------------
- Remove `ChaosCore#responseStrings`
- Remove `ChaosConfig#responseStrings`
- Remove `Plugin#responseStrings`
- Remove `Context#inputs`

v4.2.0
======

Deprecations
------------
- Deprecate `ChaosCore#responseStrings`
    - use `ChaosCore#strings` instead
- Deprecate `Plugin#responseStrings` property in plugins
    - use `Plugin#strings` instead
- Deprecate `ChaosConfig#responseStrings` property in config
    - use `ChaosConfig#strings` instead
- Deprecate loading dependant plugins by name
    - require plugins manually and use `chaos.addPlugin` instead
- Deprecate `Plugin#onListen`
- Deprecate `Plugin#onEnabled`
- Deprecate `Plugin#prepareData`
- Deprecate `Plugin#onJoinGuild`, `Service#onJoinGuild`
    - use `chaos.on("guildCreate", () => {})` instead
- Deprecate `Context#inputs`
    - use `Context#args` instead

v4.0.6
======

Breaking Changes
----------------
- Upgrade to RxJS 6
- Moved discord and chaos mocks to `ChaosCore.test`
    - `const {MockGuild} = require('chaos-core').test.discordMocks`
    - `const {MockCommand} = require('chaos-core').test.chaosMocks`
- Removed inheritance of mocks 
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
- allow components (commands, services, configActions, etc...) to be Class based
  - extend ChaosCore.Command, Service, or ConfigAction
- plugins can be listed by name

Minor Features
--------------
- added `chaos.notifyError` and `chaos.catchError` operators
    - `chaos.notifyError` will notify the bot owner of an error, and rethrow it
    - `chaos.catchError` will also notify, but will silence the error
- added `testCommand` and `testConfigAction` to stubbed Chaos bots
    - creates an observable that can be used to test a command or config action
- added `.replies` to command `Responses`
    - records all sent replies for the command
- added User directed documentation for core plugin

Bug Fixes
---------
- Fix `RoleService.findRole` not matching basic role mentions 
