const Rx = require('rx');

const Service = require('../../models/service');
const { RoleNotFoundError } = require("../../errors");

const ID_REGEX = /<@&(\d+)>|^(\d+)$/;

class RoleService extends Service {
  /**
   * Attempt to find a role in a guild by a roleString.
   *
   * The user string can be one of the following:
   * - a role mention: "<@^123132312412>"
   * - a role id: "131231243142"
   * - a role name: "exampleRole"
   *
   * @param guild {Guild}
   * @param roleString {String}
   *
   * @return {Observable<Role>}
   */
  findRole(guild, roleString) {
    const roleIdMatches = roleString.match(ID_REGEX);
    return Rx.Observable
      .if(
        () => roleIdMatches,
        Rx.Observable.of('')
          .map(() => roleIdMatches[1] || roleIdMatches[2])
          .flatMap((roleId) => this._findRoleById(guild.roles, roleId)),
        Rx.Observable.of('')
          .flatMap(() => this._findRoleByName(guild.roles, roleString)),
      )
      .do((role) => this._throwIfNoRole(role, roleString));
  }

  _findRoleById(roles, id) {
    return Rx.Observable.of('')
      .map(() => roles.find((role) => role.id === id));
  }

  _findRoleByName(roles, name) {
    return Rx.Observable.of('')
      .map(() => roles.find((role) => role.name.toLowerCase() === name.toLowerCase()));
  }

  _throwIfNoRole(user, roleString) {
    if (!user) {
      throw new RoleNotFoundError(`The role '${roleString}' could not be found`);
    }
  }
}

module.exports = RoleService;
