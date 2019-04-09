const Rx = require('rx');
const { DiscordAPIError } = require('discord.js');

const Service = require('../models/service');
const { UserNotFoundError } = require('../errors');

class UserService extends Service {
  /**
   * Attempt to find a member in a guild by a userString.
   *
   * The user string can be one of the following:
   * - a user mention: "<@!123132312412>" or"<@131231243142>"
   * - a userId: "131231243142"
   * - a user tag: "exampleUser#1234"
   *
   * @param guild {Guild}
   * @param userString {String}
   *
   * @return {Observable<GuildMember>}
   */
  findMember(guild, userString) {
    const userIdMatches = userString.match(/<@!?(\d+)>|^(\d+)$/);
    return Rx.Observable
      .if(
        () => userIdMatches,
        Rx.Observable.of('')
          .map(() => userIdMatches[1] || userIdMatches[2])
          .flatMap((userId) => this._findMemberById(guild.members, userId)),
        Rx.Observable.of('')
          .flatMap(() => this._findMemberByTag(guild.members, userString)),
      )
      .do((user) => this._throwIfNoUser(user, userString));
  }

  /**
   * Attempt to find a user in any guild by a userString.
   *
   * The user string can be one of the following:
   * - a user mention: "<@!123132312412>" or "<@131231243142>"
   * - a userId: "131231243142"
   * - a user tag: "exampleUser#1234"
   *
   * Note: Attempting to find a user by user tag is slow and unreliable. Finding
   * by mention or userId is preferred.
   *
   * @param userString {String}
   *
   * @return {Observable<User>}
   */
  findUser(userString) {
    const userIdMatches = userString.match(/<@!?(\d+)>|^(\d+)$/);
    return Rx.Observable
      .if(
        () => userIdMatches,
        Rx.Observable.of('')
          .map(() => userIdMatches[1] || userIdMatches[2])
          .flatMap((userId) => this._findUserById(userId)),
        Rx.Observable.of('')
          .flatMap(() => this._findUserByTag(this.nix.discord.users, userString)),
      )
      .do((user) => this._throwIfNoUser(user, userString));
  }

  _findUserById(userId) {
    return Rx.Observable.of('')
      .flatMap(() => this.nix.discord.fetchUser(userId))
      .catch((error) => Rx.Observable.if(
        () => error instanceof DiscordAPIError && error.message === 'Unknown User',
        Rx.Observable.of(null),
        Rx.Observable.throw(error),
      ));
  }

  _findUserByTag(users, userTag) {
    return Rx.Observable.of('')
      .map(() => users.find((user) => user.tag === userTag));
  }

  _findMemberById(members, userId) {
    return Rx.Observable.of('')
      .map(() => members.find((member) => member.user.id === userId));
  }

  _findMemberByTag(members, userTag) {
    return Rx.Observable.of('')
      .map(() => members.find((member) => member.user.tag === userTag));
  }

  _throwIfNoUser(user, userString) {
    if (!user) {
      throw new UserNotFoundError(`The user '${userString}' could not be found`);
    }
  }
}

module.exports = UserService;
