const Rx = require('rx');

const Service = require('../models/service');
const { DATAKEYS } = require('../modules/permissions/utility');

class PermissionsService extends Service {
  getDatakey(level) {
    return DATAKEYS.PERMISSIONS + '.' + level;
  }

  getPermissionsData(guildId, levelName) {
    return Rx.Observable.of('')
      .map(() => this.nix.getPermissionLevel(levelName))
      .flatMap((level) => Rx.Observable.zip(
        this.nix.getGuildData(guildId, this.getDatakey(level)),
        Rx.Observable.of(level)
      ))
      .flatMap(([savedData, level]) => {
        if (!savedData) {
          return this.setPermissionsData(guildId, level, {
            users: [],
            roles: [],
          });
        }

        return Rx.Observable.return(savedData);
      });
  }

  setPermissionsData(guildId, levelName, data) {
    return Rx.Observable.of('')
      .map(() => this.nix.getPermissionLevel(levelName))
      .flatMap((level) => this.nix.setGuildData(guildId, this.getDatakey(level), data));
  }

  addUser(guild, level, user) {
    return this.getPermissionsData(guild.id, level)
      .flatMap((savedData) => {
        let users = savedData.users;
        if (users.indexOf(user.id) !== -1) {
          let error = new Error(`The user ${user.username} already has the permission level ${level}`);
          error.name = "PermLevelError";
          return Rx.Observable.throw(error);
        }

        users.push(user.id);

        return this.setPermissionsData(guild.id, level, savedData);
      })
      .map((savedData) => savedData.users.indexOf(user.id) !== -1);
  }

  removeUser(guild, level, user) {
    return this.getPermissionsData(guild.id, level)
      .flatMap((savedData) => {
        let users = savedData.users;
        let index = users.indexOf(user.id);
        if (index === -1) {
          let error = new Error(`The user ${user.username} does not have the permission level ${level}`);
          error.name = "PermLevelError";
          return Rx.Observable.throw(error);
        }

        users.splice(index, 1);

        return this.setPermissionsData(guild.id, level, savedData);
      })
      .map((savedData) => savedData.users.indexOf(user.id) === -1);
  }

  addRole(guild, level, role) {
    return this.getPermissionsData(guild.id, level)
      .flatMap((savedData) => {
        let roles = savedData.roles;
        if (roles.indexOf(role.id) !== -1) {
          let error = new Error(`The role ${role.name} already has the permission level ${level}`);
          error.name = "PermLevelError";
          return Rx.Observable.throw(error);
        }

        roles.push(role.id);

        return this.setPermissionsData(guild.id, level, savedData);
      })
      .map((savedData) => savedData.roles.indexOf(role.id) !== -1);
  }

  removeRole(guild, level, role) {
    return this.getPermissionsData(guild.id, level)
      .flatMap((savedData) => {
        let roles = savedData.roles;
        let index = roles.indexOf(role.id);
        if (index === -1) {
          let error = new Error(`The role ${role.name} does not have the permission level ${level}`);
          error.name = "PermLevelError";
          return Rx.Observable.throw(error);}

        roles.splice(index, 1);

        return this.setPermissionsData(guild.id, level, savedData);
      })
      .map((savedData) => savedData.roles.indexOf(role.id) === -1);
  }

  hasPermission(context, commandName) {
    let guildId = context.guild.id;
    let command = this.nix.getCommand(commandName);

    if(command.ownerOnly && context.member.id !== this.nix.owner.id) {
      // command is for the owner only.
      return Rx.Observable.return(false);
    }

    if(context.member.id === this.nix.owner.id) {
      // Bot owner always has permission
      return Rx.Observable.return(true);
    }

    if (context.member.user.id === context.guild.ownerID) {
      // Guild owner always has permission
      return Rx.Observable.return(true);
    }

    if (command.permissions.length === 0) {
      // No specified levels, default to true
      return Rx.Observable.return(true);
    }

    return Rx.Observable.from(command.permissions)
      .flatMap((level) =>
        this.getPermissionsData(guildId, level)
          .catch((error) => {
            switch (error.name) {
              case "PermLevelNotFoundError":
                return Rx.Observable.empty(); // level does not exist in this guild
              default:
                return Rx.Observable.throw(error); // Unknown error
            }
          })
      )
      .toArray()
      .map((permLevels) => {
        return permLevels.some((level) => {
          if (level.users.indexOf(context.member.id) !== -1) {
            return true;
          } else if (context.member.roles.some((r) => level.roles.indexOf(r.id) !== -1)) {
            return true;
          } else {
            return false;
          }
        });
      });
  }

  filterHasPermission(context, commandName) {
    return this.hasPermission(context, commandName)
      .do((allowed) => this.nix.logger.debug(`filterHasPermission to run ${commandName}: ${allowed}`))
      .catch((error) => {
        switch (error.name) {
          case "CommandNotFoundError":
            return Rx.Observable.of(false);
          default:
            return Rx.Observable.throw(error);
        }
      })
      .filter(Boolean);
  }
}

module.exports = PermissionsService;
