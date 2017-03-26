const Clapp = require('../modules/clapp-discord');
const cfg = require('../../config.js');
const pkg = require('../../package.json');
const changelogs = require('../../data/changelog');

module.exports = new Clapp.Command({
  name: "changelog",
  desc: "See new features and changes since my last update",
  fn: (argv, context) => {
    let changelog = changelogs[0];

    let message = 'Here\'s what changed with me since my last update (' + changelog.version + '):\n\n';

    changelog.changes.forEach(change => {
      message +=
        '**' + change.type + '**: ' + change.title + '\n' +
        '    ' + change.msg + '\n' +
        '\n';
    });

    return {
      message: {message},
      context: context,
    };
  },
});
