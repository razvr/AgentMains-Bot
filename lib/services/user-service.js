class UserService {
  constructor(nix) {
    this.nix = nix;
  }

  /**
   * Attempt to find a member in a guild by a userString.
   *
   * The user string can be one of the following:
   * - a user mention: "<@!123132312412>"
   * - a *mobile* user mention: "<@131231243142>"
   * - a user tag: "exampleUser#1234"
   * - a username: "Billy Bob"
   *
   * @param userString
   *
   * @return {null|Member}
   */
  findMember(guild, userString) {
    let userIdMatches = userString.match(/<@!?(\d+)>|^(\d+)$/);

    if (userIdMatches) {
      // We have a userId! let's get the user for that

      // Get one of the two matches
      let userId = userIdMatches[1] || userIdMatches[2];

      return guild.members.find('id', userId);
    }

    //Ok, can't take the easy route, got to find them by their name
    return guild.members.find((member) => {
      let lowerUserStr = userString.toLowerCase();
      return member.user.tag.toLowerCase() === lowerUserStr
        || member.displayName.toLowerCase() === lowerUserStr;
    });
  }
}

module.exports = UserService;
