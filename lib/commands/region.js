const Clapp = require('../modules/clapp-discord');
const cfg = require('../../config.js');

module.exports = new Clapp.Command(
  {
    name: "region",
    desc: "sets your Overwatch region, and help other players know which region you play in. " +
    ""/* TODO: + "I'll also set your region for all discord servers that I am on." */,
    fn: (argv, context) => {
      return new Promise(
        (fulfill, reject) => {
          let requestedRole = argv.args.region.toLowerCase();

          if (cfg.regions.findIndex(r => r.toLowerCase() === requestedRole) !== -1) {
            let role = context.guild.roles.find(r => r.name.toLowerCase() === requestedRole);
            context.msg.member.addRole(role)
              .then(response => fulfill('I\'ve set your region to ' + role.name))
              .catch(response => {
                console.error(response);
                fulfill(
                  'Sorry, but I wasn\'t able to set your region. Can you' +
                  ' ask an admin to check my permissions? I need to be able set roles on users.'
                )
              });
          }
          else {
            fulfill('I\'m sorry, but ' + requestedRole + ' is not an available region. It must' +
              ' one of the following: ' + [...cfg.regions].join(', '));
          }
        }
      );
    },
    args: [
      {
        name: 'region',
        desc: 'The region you would like to set your region as. It can be any of the following: ' +
        [...cfg.regions].join(', '),
        type: 'string',
        required: true
      }
    ],
    flags: []
  }
);
