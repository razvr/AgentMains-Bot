const Clapp = require('clapp');
const str = require('./str-en.js');

class Command extends Clapp.Command {
  constructor(options) {
    super(options);
  }

  _getHelp(app) {
    let r = str.help_usage_command + ': ' + app.prefix + app.separator + this.name;

    // Add every argument to the usage (Only if there are arguments)
    if (Object.keys(this.args).length > 0) {
      for (let arg in this.args) {
        r += ' ' + (this.args[arg].required ? '<' + arg + '>' : '[' + arg + ']');
      }
    }

    r += '\nIt ' + this.desc;

    if (Object.keys(this.args).length > 0) {
      r += '\n\nArguments:\n';
      for (let arg in this.args) {
        let props = this.args[arg];

        r += '    ' + (props.required ? arg : '[' + arg + ']');
        if (typeof props.default !== 'undefined') { r += ' (default: ' + props.default + ')' }
        if (typeof props.desc !== 'undefined') { r += '\n        ' + props.desc }
      }
    }

    return r;
  }
}

module.exports = Command;
