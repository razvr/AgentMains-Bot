# v3.0.0

## Breaking changes
- Renamed modules to plugins

| before | replacement |
|--------|-------------|
| `require('nix-core').Module` | `require('nix-core').Plugin` |
| `nix.addModule(module)` | `nix.addPlugin(plugin)` |  
| `nix.getModule(moduleName)` | `nix.getPlugin(pluginName)` |
| `nix.getService('core', 'ModuleService')` | `nix.getService('core', 'PluginService')` |
| `nix.moduleManager` | `nix.pluginManager` | 
| `nix.moduleManager.modules` | `nix.pluginManager.plugins` |
| `config.modules` | `config.plugins` |

- Merged all core plugins together

| before | replacement |
|--------|-------------|
| `!config command enable <command>` | `!config core enableCmd <command>` |
| `!config command disable <command>` | `!config core disableCmd <command>` |
| `!config command enabled? <command>` | `!config core cmdEnabled? <command>` |
| `!config command list` | `!config core listCmds` |
| `!config command setPrefix <prefix>` | `!config core setPrefix <prefix>` |
| | |
| `!config permissions addRole <role> <permission>` | `!config core grantRole <role> <permission>` |
| `!config permissions addUser <user> <permission>` | `!config core grantUser <user> <permission>` |
| `!config permissions list` | `!config core listPerms` |
| `!config permissions rmRole <role> <permission>` | `!config core revokeRole <role> <permission>` |
| `!config permissions rmUser <user> <permission>` | `!config core revokeUser <user> <permission>` |
| | |
| `!config module enable <module>` | `!config core enablePlugin <plugin>` |
| `!config module disable <module>` | `!config core disablePlugin <plugin>` |
 
 ## New Features
 - Added RoleService
   - `getService('core', 'RoleService')`
   - `#findRole(guild, roleString)`
 - Added UserService
   - `getService('core', 'UserService')`
   - `#findUser(userString)`
   - `#findMember(guild, userString)`