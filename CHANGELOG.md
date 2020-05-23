v5.1.0
======

Deprecations (will be removed in v6)
----------------------------
- Deprecate all Discord Mocks
    - changes in Discord.js v12 break the mocks, and keeping the mocks up to 
        date is not really feasible for me
    - `MockMessage` can be replaced with `.createMessage` on stubbed bots for
        tests 

v5.0.0
======

Breaking Changes
----------------
- Removed `ChaosCore#responseStrings`
    - use `strings` instead
- Removed `ChaosConfig#responseStrings`
    - use `strings` instead
- Removed `Plugin#responseStrings`
    - use `strings` instead
- Removed `responseStrings` property in plugins
    - use `strings` instead
- Removed `Context#inputs`
    - use `args` instead
- Removed `permissions` property in plugins
    - use `permissionLevels` property instead
- Removed loading dependant plugins by name
    - require plugins manually and use `chaos#addPlugin` instead
- Removed `Plugin#onListen`
    - use `chaos#on("chaos.listen", () => {})` instead
- Removed `Plugin#prepareData`
    - use `chaos#on("guildCreate:before", () => {})` instead
- Removed `Plugin#onJoinGuild`, `Service#onJoinGuild`
    - use `chaos#on("guildCreate", () => {})` instead
- Removed `.addEventHandler`
    - use `.on` instead
- Removed `.triggerEvent`
    - use `.emit` instead
- Removed `Command#services` property
    - use `chaos#on("chaos.listen", () => {})` instead
- Removed `chaos#shutdown$`
    - use `chaos#on("chaos.shutdown", () => {})` instead
- Removed `Plugin#onEnabled`
- Removed `chaos#catchError`
    - use `chaos#handleError` instead
- Removed `utility#toObservable`
    - use `chaos#asPromise` instead
- Removed `#testCommand` and `#testConfigAction` on stubbed bots
    - use `#testMessage` instead

v4.3.0
======

Heads Up!
---------
v5.0.0 will remove RxJS as a dependency. As an upgrade path, it is recommended 
to start using promises instead of RxJS Observable streams. Call `.toPromise()` 
on an Observable to turn the observable stream into a promise. After the 
upgrade to v5.0.0, you can remove the `.toPromise()`;

Deprecations (will be removed in v5)
----------------------------
- Deprecate `.addEventHandler`
    - use `.on` instead
- Deprecate `.triggerEvent`
    - use `.emit` instead
- Deprecate `chaos#shutdown$`
    - use `chaos#on("chaos.shutdown", () => {})` instead
- Deprecate `chaos#catchError`, and `chaos#notifyError`
    - use `chaos#handleError` to notify owner of errors
- Deprecate `#testCommand` and `#testConfigAction` on stubbed bots
    - use `#testMessage` instead

New Features
------------
- Add alias functions to `ChaosComponent`:
    - `async .getGuildData(guildId, key)`
    - `async .setGuildData(guildId, key, data)`
    - `async .getUserData(userId, key)`
    - `async .setUserData(userId, key, data)`
    - `.getService(pluginName, serviceName)`
    
Bug Fixes
---------
- Fix handling of errors in grant-user and grant-role config actions


v4.2.1
======

- Fix loading strings through plugins.


v4.2.0
======

- Utilize the `chaos.strings` system in all core commands
    - see [strings.md](docs/developers/strings.md) for more info

Deprecations (will be removed in v5)
----------------------------
- Deprecate `chaos#responseStrings`
    - use `chaos#strings` instead
- Deprecate `responseStrings` property in plugins
    - use `strings` instead
- Deprecate `permissions` property in plugins
    - use `permissionLevels` instead
- Deprecate loading dependant plugins by name
    - require plugins manually and use `chaos#addPlugin` instead
- Deprecate `Plugin#onListen`
- Deprecate `Plugin#onEnabled`
- Deprecate `Plugin#prepareData`
- Deprecate `Plugin#onJoinGuild`, `Service#onJoinGuild`
    - use `chaos#on("guildCreate", () => {})` instead
- Deprecate `Context#inputs`
    - use `Context#args` instead
- Deprecate `Command#services` property
- Deprecate `utility#toObservable` property
    - use `utility#asPromise` instead

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
