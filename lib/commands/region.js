const Clapp = require('../modules/clapp-discord');
const cfg = require('../../config.js');
const regions = require('../../data/regions');

module.exports = new Clapp.Command(
  {
    name: "region",
    desc: "sets your Overwatch region, and help other players know what server/system you play" +
    " on. " +
    ""/* TODO: + "I'll also set your region for all discord servers that I am on." */,
    fn: (argv, context) => {
      return new Promise(
        (fulfill) => {
          let member = context.msg.member;

          let requestedRegion = argv.args.region.toLowerCase();
          let regionRoles = [...regions].map(r => r.role);
          let foundRegion = regions.find(r => {
            if (r.names.findIndex(n => n.toLowerCase() === requestedRegion) !== -1) return true;
            if (r.role.toLowerCase() === requestedRegion) return true;
            return false;
          });

          if (foundRegion) {
            let newRole = context.guild.roles.find(r => r.name.toLowerCase() === foundRegion.role.toLowerCase());

            if (!newRole) {
              return fulfill(
                'Sorry, but I wasn\'t able to set your region. Can you' +
                ' ask an admin to check that the role \'' + foundRegion.role + '\' exists?'
              );
            }

            let currentRoles = member.roles;
            if (currentRoles.has(newRole.id)) {
              return fulfill('Your region is already set to ' + foundRegion.role);
            }

            let rolesToRemove = currentRoles
              .filter(r => regionRoles.includes(r.name) && r.id !== newRole.id)
              .map(r => r.id);

            let errorMessage = 'Sorry, but I wasn\'t able to set your region. Can you' +
              ' ask an admin to check my permissions?';

            member.removeRoles(rolesToRemove)
              .catch(() => fulfill(errorMessage + ' I need to be able remove roles from users'))
              .then(() => {
                member.addRole(newRole.id)
                  .catch(() => fulfill(errorMessage + ' I need to be able set roles on users'))
                  .then(() => fulfill('I\'ve set your region to ' + newRole.name));
                });
          }
          else {
            let r = 'I\'m sorry, but \'' + requestedRegion + '\' is not an available region.\n\n';
            r += 'I know of the following available regions:\n';
            r += [...regions].map(r => {
                return r.role + ' (' + r.names.join(', ') + ')';
              }).join('\n');

            fulfill(r);
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
