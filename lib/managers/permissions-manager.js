const Rx = require('rx');

const PERMISSIONS_KEYWORD = 'core.permissions';
const ERR_LEVEL_NOT_FOUND = 'Level is not available';
const ERR_HAS_PERMISSION = 'Already has permission level';
const ERR_MISSING_PERMISSION = 'Does not have permission level';

class PermissionsManager {
  constructor (nix) {
    this.nix = nix;
  }

  getPermissionsData(guildId) {
    return this.nix.data.getGuildData(guildId, PERMISSIONS_KEYWORD);
  }

  setPermissionsData(guildId, data) {
    return this.nix.data.setGuildData(guildId, PERMISSIONS_KEYWORD, data);
  }

  addUser(guild, level, user) {
    return this.getPermissionsData(guild.id)
      .flatMap((savedData) => {
        let levelData = savedData[level];
        if (!levelData) { throw new Error(ERR_LEVEL_NOT_FOUND); }

        let users = levelData.users;
        if (users.indexOf(user.id) !== -1) { throw new Error(ERR_HAS_PERMISSION); }

        users.push(user.id);

        return this.setPermissionsData(guild.id, savedData);
      })
      .map((savedData) => savedData[level].users.indexOf(user.id) !== -1);
  }

  removeUser(guild, level, user) {
    return this.getPermissionsData(guild.id)
      .flatMap((savedData) => {
        let levelData = savedData[level];
        if (!levelData) { throw new Error(ERR_LEVEL_NOT_FOUND); }

        let users = levelData.users;
        let index = users.indexOf(user.id);
        if (index === -1) { throw new Error(ERR_MISSING_PERMISSION); }

        users.splice(index, 1);

        return this.setPermissionsData(guild.id, savedData);
      })
      .map((savedData) => savedData[level].users.indexOf(user.id) === -1);
  }

  addRole(guild, level, role) {
    return this.getPermissionsData(guild.id)
      .flatMap((savedData) => {
        let levelData = savedData[level];
        if (!levelData) { throw new Error(ERR_LEVEL_NOT_FOUND); }

        let roles = levelData.roles;
        if (roles.indexOf(role.id) !== -1) { throw new Error(ERR_HAS_PERMISSION); }

        roles.push(role.id);

        return this.setPermissionsData(guild.id, savedData);
      })
      .map((savedData) => savedData[level].roles.indexOf(role.id) !== -1);
  }

  removeRole(guild, level, role) {
    return this.getPermissionsData(guild.id)
      .flatMap((savedData) => {
        let levelData = savedData[level];
        if (!levelData) { throw new Error(ERR_LEVEL_NOT_FOUND); }

        let roles = levelData.roles;
        let index = roles.indexOf(role.id);
        if (index === -1) { throw new Error(ERR_MISSING_PERMISSION); }

        roles.splice(index, 1);

        return this.setPermissionsData(guild.id, savedData);
      })
      .map((savedData) => {
        return savedData[level].roles.indexOf(role.id) === -1;
      });
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

    return this.getPermissionsData(guildId)
      .map((savedData) => {
        let permLevels = command.permissions;
        if(permLevels.length === 0) {
          return true; // no specified permission levels, default to true
        }

        let allowedUsers = [];
        permLevels.forEach((level) => {
          allowedUsers = allowedUsers.concat(savedData[level].users);
        });
        if (allowedUsers.indexOf(context.member.id) !== -1) {
          return true;
        }

        let allowedRoles = [];
        permLevels.forEach((level) => {
          allowedRoles = allowedRoles.concat(savedData[level].roles);
        });
        if (context.member.roles.some((r) => allowedRoles.indexOf(r.id) !== -1)) {
          return true;
        }

        return false;
      });
  }

  filterHasPermission(context, commandName) {
    return this.hasPermission(context, commandName)
      .do((allowed) => console.log('{DEBUG}', 'filterHasPermission:', allowed))
      .filter(Boolean);
  }
}

PermissionsManager.PERMISIONS_KEYWORD = PERMISSIONS_KEYWORD;
PermissionsManager.ERR_LEVEL_NOT_FOUND = ERR_LEVEL_NOT_FOUND;
PermissionsManager.ERR_HAS_PERMISSION = ERR_HAS_PERMISSION;
PermissionsManager.ERR_MISSING_PERMISSION = ERR_MISSING_PERMISSION;

module.exports = PermissionsManager;
