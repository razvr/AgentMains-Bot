const Clapp = require('../modules/clapp-discord');
const cfg = require('../../config.js');
const pkg = require('../../package.json');
const changelogs = require('../../data/changelog');

module.exports = new Clapp.Command({
  name: "changelog",
  desc: "See new features and changes since my last update",
  flags: [
    {
      name: 'full-log',
      alias: 'f',
      desc: 'Return the full changelog instead of just the most recent',
      type: 'boolean',
      default: false,
    }
  ],
  fn: (argv, context) => {
    let logsToRender = [];

    if (argv.flags['full-log']) {
      logsToRender = changelogs;
    }
    else {
      logsToRender.push(changelogs[0]);
    }

    let message = 'Here\'s what changed with me:\n\n';

    logsToRender.forEach((changelog) => {
      message += '**Version ' + changelog.version + '**:\n';

      changelog.changes.forEach(change => {
        message +=
          '    (' + change.type + ') ' + change.title + '\n' +
          '        ' + change.msg + '\n';
      });

      message += '\n';
    });

    return {
      message: {message},
      context: context,
    };
  },
});
