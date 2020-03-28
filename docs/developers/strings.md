Strings
=======

To allow bots that use ChaosCore to change messages from commands, config actions
etc... ChaosCore provides the `chaos.strings` system.

Defining a plugin's Strings
----------------
In your plugin's definition, add a `strings` property alongside the list of 
commands, services, and configActions. This object will be deepmerged with 
existing Strings when the plugin is loaded.

```js
// awesome-plugin/index.js
module.exports = {
  commands: [
    require('./commands/rainboom'),
  ],

  //Specify strings:
  strings: {
    awesome: {
      commands: {
        rainboom: {
          serverIsCooler: () => 
            `This server just got 20% cooler!`,
        },
      },
    },
  },
};
```

The strings tree is free-form, but the recommended structures are:
- `{plugin}.commands.{commandName}.*`
- `{plugin}.configActions.{actionName}.*`
- `{plugin}.services.{serviceName}.*`

Usage in components
-------------------
On any ChaosComponent (Command, Service, ConfigAction, etc...), `this.strings`
provides an alias to `this.chaos.strings` by default. It is recommended to 
override `get strings() {}` to allow quick access to the strings relevant to
the current component. 

```js
class RainboomCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: 'rainboom',
      description: 'make the server cooler',
    });
  }

  // Override strings to 
  get strings() {
    return super.strings.awesome.commands.rainboom;
  }

  run(context, response) {
    return response.send({ 
      // Use the string in the response
      content: this.strings.serverIsCooler(),
    });
  }
}
```

Overriding strings
------------------
To change the values of the strings in an instance of the bot, specify the
`strings` property in the bot's config. This will be deepmerged over top of all
strings after plugins, commands, services, etc... have been loaded. This will
allow you to customize the messages returned from commands as desired. If a
string is not specified in the config, the default string will still be used.

```js
const config = {
  // ...
  strings: {
    awesome: {
      commands: {
        rainboom: {
          serverIsCooler: () => 
            `Yo, this server is sooo cool!`,
        },
      },
    },
  }
}
``` 
