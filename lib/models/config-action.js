const { of } = require('rxjs');

const ChaosComponent = require('./chaos-component');

class ConfigAction extends ChaosComponent {
  constructor(chaos, options) {
    super(chaos);

    this.name = options.name || null;
    this.pluginName = options.pluginName || null;
    this.description = options.description || null;

    if (options.inputs) {
      this.args = options.inputs || [];
      delete options.inputs;
    } else {
      this.args = options.args || [];
    }

    Object.assign(this, options);
  }

  get inputs() {
    this.chaos.logger.warn('Context#inputs is deprecated. Please use Context#args');
    return this.args;
  }

  get requiredArgs() {
    return this.args.filter((input) => input.required);
  }

  execAction(context) {
    this.args.forEach((arg, index) => {
      if(typeof context.args[arg.name] === "undefined") {
        context.args[arg.name] = context.args[`input${index + 1}`];
      }
    });

    if (this.checkMissingArgs(context)) {
      return of({
        status: 400,
        content: this.chaos.strings.commandParsing.error.missingArgument({}),
        embed: this.helpEmbed(),
      });
    } else {
      return this.run(context);
    }
  }

  run() {}

  checkMissingArgs(context) {
    return this.requiredArgs.some((arg) => typeof context.args[arg.name] === 'undefined');
  }

  helpEmbed() {
    let usageField = {
      name: 'Usage',
      value: `!config ${this.pluginName} ${this.name}`,
    };

    let argsList = [];

    this.args.forEach((arg) => {
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
        name: 'Args',
        value: argsList.join('\n'),
      });
    }

    return embed;
  }
}

module.exports = ConfigAction;
