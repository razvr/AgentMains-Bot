const Clapp = require('../modules/clapp-discord');
const regions = require('../../data/regions');
const responses = require('../../data/responses').region;

module.exports = new Clapp.Command({
  name: "region",
  desc: "sets the Overwatch servers/system that you often play on, and help other players know" +
  " what server/system you play on. ",
  fn: (argv, context) => new Promise(fulfill => {
    commandFn(argv, context)
      .then(response => fulfill({
        message: {
          type: 'reply',
          message: response,
        },
        context: context,
      }));
  }),
  args: [
    {
      name: 'region',
      desc: 'The region server/system you play on',
      type: 'string',
      required: true,
    }
  ],
  flags: [],
});

function commandFn(argv, context) {
  return new Promise(fulfill => {
    let member = context.msg.member;

    let requestedRegion = argv.args.region.toLowerCase();
    let foundRegion = findRegion(requestedRegion);

    if (!foundRegion) {
      return fulfill(responses.regionNotFound(regions, requestedRegion));
    }

    let newRole = findRole(context.guild, foundRegion.role);

    if (!newRole) {
      return fulfill(responses.roleNotFound(foundRegion.role));
    }

    if (member.roles.has(newRole.id)) {
      return fulfill(responses.roleAlreadySet(foundRegion.role));
    }

    setRegionRole(member, newRole)
      .then(response => fulfill(response));
  });
}

function findRegion(requestedRegion) {
  return regions.find(r => (
    (r.names.findIndex(n => n.toLowerCase() === requestedRegion) !== -1)
    || (r.role.toLowerCase() === requestedRegion)
  ));
}

function findRole(guild, roleName) {
  return guild.roles.find(
    r => r.name.toLowerCase() === roleName.toLowerCase()
  );
}

function setRegionRole(member, newRole) {
  return new Promise(fulfill => {
    let regionRoles = [...regions].map(r => r.role);
    let rolesToRemove = member.roles
      .filter(r => regionRoles.includes(r.name) && r.id !== newRole.id)
      .map(r => r.id);

    member.removeRoles(rolesToRemove)
      .catch(() => fulfill(responses.couldNotRemoveRole()))
      .then(() => member.addRole(newRole.id)
        .catch(() => fulfill(responses.couldNotAddRole()))
        .then(() => fulfill(responses.roleSet(newRole.name)))
      )
  });
}


