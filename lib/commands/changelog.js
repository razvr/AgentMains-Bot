const Clapp = require('../modules/clapp-discord');
const cfg = require('../../config.js');
const pkg = require('../../package.json');
const changelog = require('../../data/changelog');

module.exports = new Clapp.Command({
  name: "changelog",
  desc: "See new features and changes since my last update",
  fn: (argv, context) => {
    let message = 'Here\'s what changed with me since my last update:\n\n';

    changelog[0].forEach(change => {
      message += change.type + '\n    ' + change.msg + '\n\n';
    });

    return {
      message: {message},
      context: context,
    };
  },
});
