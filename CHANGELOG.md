Next
====

Breaking Changes
--------------
- Upgrade to RxJS 6
- Moved discord and chaos mocks to `ChaosCore.test`
  - `const {MockGuild} = require('chaos-core').test.discordMocks`
  - `const {MockCommand} = require('chaos-core').test.chaosMocks`
- Removed Mockery from chaos mocks
- Removed `services` and `commands` from config

Minor Features
--------------
- added chaos.notifyError and chaos.catchError operators
    - chaos.notifyError will notify the bot owner of an error, and rethrow it
    - chaos.catchError will also notify, but will silence the error
