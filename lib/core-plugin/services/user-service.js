const { iif, of, throwError } = require('rxjs');
const { map, flatMap, tap, catchError } = require('rxjs/operators');
const { DiscordAPIError } = require('discord.js');

const Service = require('../../models/service');
const { UserNotFoundError } = require('../../errors');

const ID_REGEX = /<@!?(\d+)>|^(\d+)$/;

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
    const userIdMatches = userString.match(ID_REGEX);
    return iif(
      () => userIdMatches,
      of('').pipe(
        map(() => userIdMatches[1] || userIdMatches[2]),
        flatMap((userId) => this._findMemberById(guild.members, userId)),
      ),
      of('').pipe(
        flatMap(() => this._findMemberByTag(guild.members, userString)),
      ),
    ).pipe(
      tap((user) => this._throwIfNoUser(user, userString)),
    );
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
    const userIdMatches = userString.match(ID_REGEX);
    return iif(
      () => userIdMatches,
      of('').pipe(
        map(() => userIdMatches[1] || userIdMatches[2]),
        flatMap((userId) => this._findUserById(userId)),
      ),
      of('').pipe(
        flatMap(() => this._findUserByTag(this.chaos.discord.users, userString)),
      ),
    ).pipe(
      tap((user) => this._throwIfNoUser(user, userString)),
    );
  }

  _findUserById(userId) {
    return of('').pipe(
      flatMap(() => this.chaos.discord.fetchUser(userId)),
      catchError((error) => iif(
        () => error instanceof DiscordAPIError && error.message === 'Unknown User',
        of(null),
        throwError(error),
      )),
    );
  }

  _findUserByTag(users, userTag) {
    return of('').pipe(
      map(() => users.find((user) => user.tag === userTag)),
    );
  }

  _findMemberById(members, userId) {
    return of('').pipe(
      map(() => members.find((member) => member.user.id === userId)),
    );
  }

  _findMemberByTag(members, userTag) {
    return of('').pipe(
      map(() => members.find((member) => member.user.tag === userTag)),
    );
  }

  _throwIfNoUser(user, userString) {
    if (!user) {
      throw new UserNotFoundError(`The user '${userString}' could not be found`);
    }
  }
}

module.exports = UserService;
