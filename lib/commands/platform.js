const Rx = require('rx');

const Command = require('../command');
const Response = require('../response');

const platforms = require('../../config/platforms');

let responses = {
  platformNotFound: (platform) => {
    let response = new Response(Response.TYPE_REPLY);
    response.content = 'I\'m sorry, but \'' + platform + '\' is not an available platform.';
    return response;
  },
  unableToUpdateNickname: () => {
    let response = new Response(Response.TYPE_REPLY);
    response.content = 'I\'m sorry, but I was not able to update your nickname. Please ask an admin to make sure I ' +
      'have the "Manage Nicknames" permission.';
    return response;
  },
};

module.exports = new Command({
  name: 'platform',
  description: 'Sets the platform that you most often play Overwatch on.',
  args: [
    {
      name: 'platform',
      description: 'The platform server/system you play on',
      required: true,
    },
  ],

  run(context) {
    if (context.channel.type !== 'text') {
      let response = new Response(Response.TYPE_REPLY);
      response.content = 'You can only change your platform from a server.';
      return Rx.Observable.just(response);
    }

    let foundPlatform = findPlatformWithName(context.args.platform);
    if (!foundPlatform) {
      return Rx.Observable.just(responses.platformNotFound(context.args.platform));
    }

    return setPlatformTag(context.member, foundPlatform)
      .map((platform) => {
        let response = new Response(Response.TYPE_REPLY);
        response.content = 'I\'ve updated your platform to ' + platform.name;
        return response;
      })
      .catch(() => Rx.Observable.just(responses.unableToUpdateNickname()));
  },
});

function findPlatformWithName(name) {
  return platforms.find((platform) => platformHasName(platform, name));
}

function platformHasName(platform, name) {
  let platformNames = platform.alias
    .map((alias) => alias.toLowerCase());
  platformNames.push(platform.name.toLowerCase());

  return platformNames.indexOf(name.toLowerCase()) !== -1;
}

function setPlatformTag(member, newPlatform) {
  let currentNickname = member.nickname ? member.nickname : member.user.username;
  let newNickname;

  let platformTag = '[' + newPlatform.tag + ']';

  if (currentNickname.search(/\[\w+\]$/) !== -1) {
    newNickname = currentNickname.replace(/\[\w+\]$/, platformTag);
  } else {
    newNickname = currentNickname + ' ' + platformTag;
  }

  return Rx.Observable.fromPromise(member.setNickname(newNickname))
    .map(() => newPlatform);
}

