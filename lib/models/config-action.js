const { of } = require('rxjs');

const ChaosComponent = require('./chaos-component');

class ConfigAction extends ChaosComponent {
  constructor(chaos, options) {
    super(chaos);

    this.name = null;
    this.pluginName = null;
    this.description = null;

    this.inputs = [];

    Object.assign(this, options);
  }

  get requiredInputs() {
    return this.inputs.filter((input) => input.required);
  }

  execAction(context) {
    context.inputs = {};
    this.inputs.forEach((input, index) => {
      context.inputs[input.name] = context.args[`input${index + 1}`];
    });

    if (this.checkMissingInputs(context)) {
      return of({
        status: 404,
        content: this.chaos.responseStrings.commandParsing.error.missingArgument({}),
        embed: this.helpEmbed(),
      });
    } else {
      return this.run(context);
    }
  }

  run() {}

  checkMissingInputs(context) {
    return this.requiredInputs.some((input) => typeof context.inputs[input.name] === 'undefined');
  }

  helpEmbed() {
    let usageField = {
      name: 'Usage',
      value: `!config ${this.pluginName} ${this.name}`,
    };

    let inputsList = [];

    this.inputs
      .forEach((input) => {
        if (input.required) {
          usageField.value += ' <' + input.name + '>';
          inputsList.push('**' + input.name + '**: ' + input.description);
        } else {
          usageField.value += ' [' + input.name + ']';
          inputsList.push('**' + input.name + '** (optional): ' + input.description);
        }
      });

    let embed = {
      title: this.name,
      description: this.description || '\u200B',
      fields: [usageField],
    };

    if (inputsList.length >= 1) {
      embed.fields.push({
        name: 'Inputs',
        value: inputsList.join('\n'),
      });
    }

    return embed;
  }
}

module.exports = ConfigAction;
