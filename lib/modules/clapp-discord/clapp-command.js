const Clapp = require('clapp');
const Table = require('cli-table2');
const str = require('./str-en.js');

class Command extends Clapp.Command {
  constructor(options) {
    super(options);
  }

  _getHelp(app) {
    const LINE_WIDTH = 175;

    var r = str.help_usage + ' ' + app.prefix + app.separator + this.name;

    // Add every argument to the usage (Only if there are arguments)
    if (Object.keys(this.args).length > 0) {
      var args_table = new Table(
        {
          chars: {
            'top': '', 'top-mid': '', 'top-left': '', 'top-right': '', 'bottom': '',
            'bottom-mid': '', 'bottom-left': '', 'bottom-right': '', 'left': '',
            'left-mid': '', 'mid': '', 'mid-mid': '', 'right': '', 'right-mid': '',
            'middle': ''
          },
          head: ['Argument', 'Description', 'Default'],
          colWidths: [
            Math.round(0.10 * LINE_WIDTH),
            Math.round(0.45 * LINE_WIDTH),
            Math.round(0.25 * LINE_WIDTH)
          ],
          wordWrap: true
        }
      );
      for (var i in this.args) {
        r += this.args[i].required ? ' (' + i + ')' : ' [' + i + ']';
        args_table.push(
          [
            i,
            typeof this.args[i].desc !== 'undefined' ?
              this.args[i].desc : '',
            typeof this.args[i].default !== 'undefined' ?
              this.args[i].default : ''
          ]
        );
      }
    }

    r += '\n' + this.desc;

    if (Object.keys(this.args).length > 0)
      r += '\n\n' + str.help_av_args + ':\n\n```' + args_table.toString() + '```';

    // Add every flag, only if there are flags to add
    if (Object.keys(this.flags).length > 0) {
      var flags_table = new Table(
        {
          chars: {
            'top': '', 'top-mid': '', 'top-left': '', 'top-right': '', 'bottom': '',
            'bottom-mid': '', 'bottom-left': '', 'bottom-right': '', 'left': '',
            'left-mid': '', 'mid': '', 'mid-mid': '', 'right': '', 'right-mid': '',
            'middle': ''
          },
          head: ['Option', 'Description', 'Default'],
          colWidths: [
            Math.round(0.10 * LINE_WIDTH),
            Math.round(0.45 * LINE_WIDTH),
            Math.round(0.25 * LINE_WIDTH)
          ],
          wordWrap: true
        }
      );
      for (i in this.flags) {
        flags_table.push(
          [
            (typeof this.flags[i].alias !== 'undefined' ?
              '-' + this.flags[i].alias + ', ' : '') + '--' + i,
            typeof this.flags[i].desc !== 'undefined' ?
              this.flags[i].desc : '',
            typeof this.flags[i].default !== 'undefined' ?
              this.flags[i].default : ''
          ]
        );
      }

      r += '\n\n' + str.help_av_options + ':\n\n```' + flags_table.toString() + '```';
    }

    if (Object.keys(this.args).length > 0)
      r += '\n\n' + str.help_args_required_optional;

    return r;
  }
}

module.exports = Command;
