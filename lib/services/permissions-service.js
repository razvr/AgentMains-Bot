const Rx = require('rx');

const Service = require('../models/service');
const { DATAKEYS } = require('../modules/permissions/utility');

class PermissionsService extends Service {
  getDatakey(level) {
    return DATAKEYS.PERMISSIONS + '.' + level;
  }

  getPermissionsData(guildId, levelName) {
    return Rx.Observable.of('')
      .map(() => this.chaos.getPermissionLevel(levelName))
      .flatMap((level) => Rx.Observable.zip(
        this.chaos.getGuildData(guildId, this.getDatakey(level)),
        Rx.Observable.of(level),
      ))
      .flatMap(([savedData, level]) => {
        if (!savedData) {
          return this.setPermissionsData(guildId, level, {
            name: level,
            users: [],
            roles: [],
          });
        }

        return Rx.Observable.return(savedData);
      });
  }

  setPermissionsData(guildId, levelName, data) {
    return Rx.Observable.of('')
      .map(() => this.chaos.getPermissionLevel(levelName))
      .flatMap((level) => this.chaos.setGuildData(guildId, this.getDatakey(level), data));
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
    let command = this.chaos.getCommand(commandName);

    if(command.ownerOnly && context.author.id !== this.chaos.owner.id) {
      // command is for the owner only.
      this.chaos.logger.debug('Command can only be ran by the bot owner.');
      return Rx.Observable.return(false);
    }

    if(context.author.id === this.chaos.owner.id) {
      // Bot owner always has permission
      this.chaos.logger.debug('User is bot owner; By-passing permissions');
      return Rx.Observable.return(true);
    }

    if (context.author.id === context.guild.ownerID) {
      // Guild owner always has permission
      this.chaos.logger.debug('User is guild owner; By-passing permissions');
      return Rx.Observable.return(true);
    }

    if (command.permissions.length === 0) {
      // No specified levels, default to true
      this.chaos.logger.debug('Command has no specified permissions.');
      return Rx.Observable.return(true);
    }

    return Rx.Observable.from(command.permissions)
      .flatMap((level) => {
        this.chaos.logger.debug(`Checking permission level ${level}`);
        return this.getPermissionsData(guildId, level)
          .catch((error) => {
            switch (error.name) {
              case "PermLevelNotFoundError":
                this.chaos.logger.debug(`Permission level ${level} does not exist.`);
                return Rx.Observable.empty(); // level does not exist in this guild
              default:
                return Rx.Observable.throw(error); // Unknown error
            }
          });
      })
      .toArray()
      .map((permLevels) => {
        return permLevels.some((level) => {
          if (level.users.indexOf(context.author.id) !== -1) {
            this.chaos.logger.debug(`User has permission level ${level.name}`);
            return true;
          } else if (context.member.roles.some((r) => level.roles.indexOf(r.id) !== -1)) {
            this.chaos.logger.debug(`One of the user's roles has permission level ${level.name}`);
            return true;
          } else {
            this.chaos.logger.debug(`User does not have permission level ${level.name}`);
            return false;
          }
        });
      });
  }

  filterHasPermission(context, commandName) {
    return this.hasPermission(context, commandName)
      .do((allowed) => this.chaos.logger.debug(`filterHasPermission to run ${commandName}: ${allowed}`))
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
