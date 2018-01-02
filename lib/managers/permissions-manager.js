const Rx = require('rx');

const {DATAKEYS, ERRORS} = require('../modules/permissions/utility');

class PermissionsManager {
  constructor (nix) {
    this.nix = nix;
    this.levels = [];
  }

  getDatakey(level) {
    return DATAKEYS.PERMISSIONS + '.' + level;
  }

  getPermissionsData(guildId, level) {
    if (this.levels.indexOf(level.toLowerCase()) === -1) {
      return Rx.Observable.throw(new Error(ERRORS.LEVEL_NOT_FOUND));
    }

    return this.nix.data.getGuildData(guildId, this.getDatakey(level))
      .flatMap((savedData) => {
        if (!savedData) {
          return this.setPermissionsData(guildId, level, {
            users: [],
            roles: [],
          });
        }

        return Rx.Observable.return(savedData);
      });
  }

  setPermissionsData(guildId, level, data) {
    if (this.levels.indexOf(level.toLowerCase()) === -1) {
      return Rx.Observable.throw(new Error(ERRORS.LEVEL_NOT_FOUND));
    }

    return this.nix.data.setGuildData(guildId, this.getDatakey(level), data);
  }

  addPermissionLevel(level) {
    if (this.levels.indexOf(level.toLowerCase()) === -1) {
      this.levels.push(level.toLowerCase());
    }
  }

  addUser(guild, level, user) {
    return this.getPermissionsData(guild.id, level)
      .flatMap((savedData) => {
        let users = savedData.users;
        if (users.indexOf(user.id) !== -1) {
          return Rx.Observable.throw(new Error(ERRORS.HAS_PERMISSION));
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
          return Rx.Observable.throw(ERRORS.MISSING_PERMISSION);
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
          return Rx.Observable.throw(new Error(ERRORS.HAS_PERMISSION));
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
        if (index === -1) { throw new Error(ERRORS.MISSING_PERMISSION); }

        roles.splice(index, 1);

        return this.setPermissionsData(guild.id, level, savedData);
      })
      .map((savedData) => savedData.roles.indexOf(role.id) === -1);
  }

  hasPermission(context, commandName) {
    let command = this.nix.commandManager.commands[commandName];
    let guildId = context.guild.id;

    if (!command) {
      // Non-existant commands don't have permission
      return Rx.Observable.return(false);
    }

    if (context.channel.type !== 'text') {
      // All commands have permission on non test channels
      return Rx.Observable.return(true);
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
            if (error.message === ERRORS.LEVEL_NOT_FOUND) {
              return Rx.Observable.empty(); // level does not exist in this guild
            }
          })
      )
      .toArray()
      .map((permLevels) => {
        return permLevels.find((level) => {
          if (level.users.indexOf(context.member.id) !== -1) {
            return true;
          }

          if (context.member.roles.some((r) => level.roles.indexOf(r.id) !== -1)) {
            return true;
          }

          return false;
        });
      })
      .map((level) => !!level); //convert to boolean
  }

  filterHasPermission(context, commandName) {
    return this.hasPermission(context, commandName)
      .do((allowed) => console.log('{DEBUG}', 'filterHasPermission:', allowed))
      .filter(Boolean);
  }
}

module.exports = PermissionsManager;
