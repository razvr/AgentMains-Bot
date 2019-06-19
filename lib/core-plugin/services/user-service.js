const { iif, of, throwError, from, merge } = require('rxjs');
const { map, flatMap, take, catchError, filter, toArray, find, defaultIfEmpty } = require('rxjs/operators');
const { DiscordAPIError } = require('discord.js');

const Service = require('../../models/service');
const { UserNotFoundError, AmbiguousUserError } = require('../../errors');

const ID_REGEX = /<@!?(\d+)>|^(\d+)$/;

class UserService extends Service {
  /**
   * Attempt to find a member in a guild by a userString.
   *
   * The user string can be one of the following:
   * - an user mention: "<@!123132312412>" or"<@131231243142>"
   * - an userId: "131231243142"
   * - an user tag: "exampleUser#1234"
   * - an user's username: "exampleUser"
   * - an user's nickname: "exampleNickname"
   *
   * @param guild {Guild}
   * @param userString {String}
   *
   * @return {Observable<GuildMember>}
   */
  findMember(guild, userString) {
    const userIdMatches = userString.match(ID_REGEX);

    return of('').pipe(
      flatMap(() => {
        if (userIdMatches) {
          const userID = userIdMatches[1] || userIdMatches[2];
          return from(guild.members.array()).pipe(
            find((member) => member.user.id === userID),
          );
        } else {
          return of('').pipe(
            flatMap(() => this._findMembersByString(guild, userString)),
            flatMap((members) => {
              switch (members.length) {
                case 0:
                  return throwError(new UserNotFoundError(
                    `The user '${userString}' could not be found`,
                  ));
                case 1:
                  return of(members[0]);
                default:
                  return throwError(new AmbiguousUserError(
                    `'${userString}' matched to multiple users. Please specify the user by mention, or ID`,
                  ));
              }
            }),
          );
        }
      }),
      this._throwIfNoUser(userString),
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
      this._throwIfNoUser(userString),
    );
  }

  _findMembersByString(guild, userString) {
    return from(guild.members.array()).pipe(
      flatMap((member) => merge(
        of(member).pipe(
          filter(() => member.user.tag),
          filter(() => member.user.tag.toLowerCase() === userString.toLowerCase()),
        ),
        of(member).pipe(
          filter(() => member.user.username),
          filter(() => member.user.username.toLowerCase() === userString.toLowerCase()),
        ),
        of(member).pipe(
          filter(() => member.nickname),
          filter(() => member.nickname.toLowerCase() === userString.toLowerCase()),
        ),
      ).pipe(
        take(1),
      )),
      toArray(),
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

  _throwIfNoUser(userString) {
    return (source) => source.pipe(
      defaultIfEmpty(false),
      flatMap((user) => user
        ? of(user)
        : throwError(new UserNotFoundError(`The user '${userString}' could not be found`)),
      ),
    );
  }
}

module.exports = UserService;
