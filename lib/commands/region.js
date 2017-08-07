const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

const regions = require('../../config/regions');

let responses = {
  regionNotFound: (region) => {
    let response = new Response(Response.TYPE_REPLY);
    response.content = 'I\'m sorry, but \'' + region + '\' is not an available region.';
    return response;
  },
  roleNotFound: (role) => {
    let response = new Response(Response.TYPE_MESSAGE);
    response.content = 'Looks like the role ' + role + ' doesn\'t exist. Can you ask an admin to create that role?';
    return response;
  },
  unableToUpdateRoles: () => {
    let response = new Response(Response.TYPE_MESSAGE);
    response.content = 'Looks like I\'m unable to update your roles. Can you ask an admin to check my permissions?';
    return response;
  },
};

module.exports = new Command({
  name: 'region',
  description: 'Sets the Overwatch region that you most often play on.',
  args: [
    {
      name: 'region',
      description: 'The region server/system you play on',
      required: true,
    },
  ],

  run: (context) => {
    let member = context.message.member;

    if (context.message.channel.type !== 'text') {
      let response = new Response(Response.TYPE_REPLY);
      response.content = 'You can only change your region from a server.';
      return Rx.Observable.just(response);
    }

    let foundRegion = findRegionWithName(context.args.region);
    if (!foundRegion) {
      return Rx.Observable.just(responses.regionNotFound(context.args.region));
    }

    let newRole = findRole(context.message.guild, foundRegion.role);
    if (!newRole) {
      return Rx.Observable.just(responses.roleNotFound(foundRegion.role));
    }

    return setRegionRole(member, newRole)
      .map(() => {
        let response = new Response(Response.TYPE_REPLY);
        response.content = 'I\'ve updated your region to ' + foundRegion.name;
        return response;
      })
      .catch((error) => Rx.Observable.just(responses.unableToUpdateRoles()));
  },
});

function findRegionWithName(name) {
  return regions.find((region) => regionHasName(region, name));
}

function regionHasName(region, name) {
  let regionNames = region.alias
    .map((alias) => alias.toLowerCase());
  regionNames.push(region.name.toLowerCase());

  return regionNames.indexOf(name.toLowerCase()) !== -1;
}

function findRole(guild, roleName) {
  return guild.roles
    .find((role) => role.name.toLowerCase() === roleName.toLowerCase());
}

function setRegionRole(member, newRole) {
  let regionRoles = regions.map((region) => region.role);

  let roleIdsToRemove = member.roles
    .filter((role) => regionRoles.includes(role.name) && role.id !== newRole.id)
    .map((role) => role.id);

  return Rx.Observable.return()
    .flatMap(() => Rx.Observable.fromPromise(member.removeRoles(roleIdsToRemove)))
    .flatMap(() => Rx.Observable.fromPromise(member.addRole(newRole.id)));
}

