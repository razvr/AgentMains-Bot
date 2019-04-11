class Command {
  get nix() {
    this.chaos.logger.warn('.nix is deprecated. Please use .chaos instead');
    return this.chaos;
  }

  constructor(chaos, options={}) {
    delete options.chaos; // Make sure the nix property isn't overwritten.
    this.chaos = chaos;

    // Preload default values
    this.moduleName = null;
    this.name = null;
    this.description = null;
    this.run = null;

    // Set default permissions
    this.ownerOnly = false;
    this.adminOnly = false;
    this.permissions = [];
    this.enabledByDefault = true;
    this.showInHelp = true;

    // Set default flags and args
    this.flags = [];
    this.args = [];
    this.services = [];

    // Overwrite defaults
    Object.assign(this, options);

    if (this.ownerOnly && this.name.indexOf('owner:') !== 0) {
      this.name = 'owner:' + this.name;
    }

    if (this.adminOnly && this.permissions.length === 0) {
      this.permissions = ['admin'];
    }

    this.flags.push({
      name: 'help',
      shortAlias: 'h',
      type: 'boolean',
      description: "Display help for this command",
      showInHelp: false,
    });

    this._validate();
  }

  _validate() {
    if (typeof this.name !== "string") {
      let error = new Error("Name for command is missing.");
      error.name = "InvalidCommandError";
      throw error;
    }
    else if (typeof this.moduleName !== "string") {
      let error = new Error(`moduleName for command ${this.name} is missing.`);
      error.name = "InvalidCommandError";
      throw error;
    }
    else if (typeof this.run !== "function") {
      let error = new Error(`run function for command ${this.name} is missing.`);
      error.name = "InvalidCommandError";
      throw error;
    }
  }

  get requiredArgs() {
    return this.args.filter((arg) => arg.required);
  }

  checkHasHelpFlag(context) {
    return context.flags['help'] === true;
  }

  checkMissingArgs(context) {
    return this.requiredArgs.some((arg) => typeof context.args[arg.name] === 'undefined');
  }

  execCommand(context, response) {
    if (this.checkHasHelpFlag(context)) {
      return this.help(context, response);
    }
    else if (this.checkMissingArgs(context)) {
      return this.argsMissing(context, response);
    }
    else {
      return this.run(context, response);
    }
  }

  help(context, response) {
    response.type = 'embed';
    response.content = this.nix.responseStrings.commandParsing.help({});
    response.embed = this.helpEmbed();
    return response.send();
  }

  argsMissing(context, response) {
    response.type = 'embed';
    response.content = context.nix.responseStrings.commandParsing.error.missingArgument({});
    response.embed = this.helpEmbed();
    return response.send();
  }

  helpEmbed() {
    let usageField = {
      name: 'Usage',
      value: '!' + this.name,
    };

    let argsList = [];
    let flagsList = [];

    this.flags
      .filter((flag) => typeof flag.showInHelp === 'undefined' || flag.showInHelp === true)
      .forEach((flag) => {
        let namePart = '';
        let aliasPart = '';
        let descPart = '';

        if (flag.shortAlias) {
          aliasPart = '( -' + flag.shortAlias + ' )';
        }

        if (flag.required) {
          usageField.value += ' --' + flag.name;
          namePart = '**--' + flag.name + '** ' + aliasPart;
          descPart = flag.description;
        } else {
          usageField.value += ' [--' + flag.name + ']';
          namePart = '*--' + flag.name + '* ' + aliasPart;
          descPart = '(optional) ' + flag.description;
        }

        flagsList.push(namePart + ': ' + descPart);
      });

    this.args
      .filter((arg) => typeof arg.showInHelp === 'undefined' || arg.showInHelp === true)
      .forEach((arg) => {
        if (arg.required) {
          usageField.value += ' <' + arg.name + '>';
          argsList.push('**' + arg.name + '**: ' + arg.description);
        } else {
          usageField.value += ' [' + arg.name + ']';
          argsList.push('**' + arg.name + '** (optional): ' + arg.description);
        }
      });

    let embed = {
      title: this.name,
      description: this.description || '\u200B',
      fields: [usageField],
    };

    if (argsList.length >= 1) {
      embed.fields.push({
        name: 'Arguments',
        value: argsList.join('\n'),
      });
    }

    if (flagsList.length >= 1) {
      embed.fields.push({
        name: 'Flags',
        value: flagsList.join('\n'),
      });
    }

    return embed;
  }
}

module.exports = Command;
