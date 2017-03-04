const git = require('git-rev');

const Clapp = require('../modules/clapp-discord');
const cfg = require('../../config.js');
const pkg = require('../../package.json');

module.exports = new Clapp.Command(
  {
    name: "info",
    desc: "Gets information about me",
    fn: (argv, context) => {
      return new Promise(
        (fulfill) => {
          let gitUrl = 'https://github.com/SpyMaster356/nix-discord-bot';

          git.short(
            (gitHash) => {
              let response =
                'Hello!\n\n' +
                'I\'m Nix, and I was created to help automate some things on this Discord' +
                ' server.\n\n' +
                'My creator is SpyMaster356, and you can find him by the same name' +
                ' on Steam, Twitter, Github, Overwatch, and Reddit.\n' +
                '\n' +
                'I\'m currently using build ' + gitHash + ' of my code.\n' +
                'You can view my source code on GitHub at ' + pkg.repository + '\n';
              fulfill(response);
            }
          );
        }
      );
    }
  }
);
