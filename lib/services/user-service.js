const Discord = require('discord.js');

class UserService {
  constructor(nix) {
    this.nix = nix;
  }


  /**
   * Attempt to find a member in a guild by a userString.
   *
   * The user string can be one of the following:
   * - a user mention: <@!123132312412>
   * - a *mobile* user mention <@131231243142>
   * - a user tag: exampleUser#1234
   * - a username: Billy Bob
   *
   * @param userString
   *
   * @return {null | Member}
   */
  findMember(guild, userString) {
    let member = null;
    let userIdMatches = userString.match(/<@!?(\d+)>|^(\d+)$/);
    let userId;

    if (userIdMatches) {
      //Find the matched user id group
      userId = userIdMatches[1] || userIdMatches[2];
    }

    if (!userId) {
      //Ok, can't take the easy route, got to find them another way
      return "No ID";
    }
    else {
      //We have a userId! let's get the user for that
      return guild.members.find('id', userId);
    }
  }

  /**
   * Attempt to find a member in a guild by a userString.
   *
   * The user string can be one of the following:
   * - a user mention: <@!123132312412>
   * - a *mobile* user mention <@131231243142>
   * - a user tag: exampleUser#1234
   * - a username: Billy Bob
   *
   * @param userString
   *
   * @return {undefined | Discord.Member}
   */
  findUser(userString) {

  }
}

module.exports = UserService;
