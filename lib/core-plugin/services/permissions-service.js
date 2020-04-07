const { of, zip, EMPTY, from, throwError } = require('rxjs');
const { tap, map, flatMap, catchError, toArray, filter } = require('rxjs/operators');

const Service = require('../../models/service');
const DataKeys = require('../datakeys');
const { PermLevelError } = require("../../errors");

class PermissionsService extends Service {
  getDatakey(level) {
    return DataKeys.PERMISSIONS + '.' + level;
  }

  getPermissionsData(guildId, levelName) {
    return of('').pipe(
      map(() => this.chaos.getPermissionLevel(levelName)),
      flatMap((level) => zip(
        this.getGuildData(guildId, this.getDatakey(level)),
        of(level),
      )),
      flatMap(([savedData, level]) => {
        if (!savedData) {
          return this.setPermissionsData(guildId, level, {
            name: level,
            users: [],
            roles: [],
          });
        }

        return of(savedData);
      }),
    );
  }

  setPermissionsData(guildId, levelName, data) {
    return of('').pipe(
      map(() => this.chaos.getPermissionLevel(levelName)),
      flatMap((level) => this.setGuildData(guildId, this.getDatakey(level), data)),
    );
  }

  addUser(guild, level, user) {
    return this.getPermissionsData(guild.id, level).pipe(
      flatMap((savedData) => {
        let users = savedData.users;
        if (users.indexOf(user.id) !== -1) {
          let error = new PermLevelError(`The user ${user.username} already has the permission level ${level}`);
          return throwError(error);
        }

        users.push(user.id);

        return this.setPermissionsData(guild.id, level, savedData);
      }),
      map((savedData) => savedData.users.indexOf(user.id) !== -1),
    );
  }

  removeUser(guild, level, user) {
    return this.getPermissionsData(guild.id, level).pipe(
      flatMap((savedData) => {
        let users = savedData.users;
        let index = users.indexOf(user.id);
        if (index === -1) {
          let error = new PermLevelError(`The user ${user.username} does not have the permission level ${level}`);
          return throwError(error);
        }

        users.splice(index, 1);

        return this.setPermissionsData(guild.id, level, savedData);
      }),
      map((savedData) => savedData.users.indexOf(user.id) === -1),
    );
  }

  addRole(guild, level, role) {
    return this.getPermissionsData(guild.id, level).pipe(
      flatMap((savedData) => {
        let roles = savedData.roles;
        if (roles.indexOf(role.id) !== -1) {
          let error = new PermLevelError(`The role ${role.name} already has the permission level ${level}`);
          return throwError(error);
        }

        roles.push(role.id);

        return this.setPermissionsData(guild.id, level, savedData);
      }),
      map((savedData) => savedData.roles.indexOf(role.id) !== -1),
    );
  }

  removeRole(guild, level, role) {
    return this.getPermissionsData(guild.id, level).pipe(
      flatMap((savedData) => {
        let roles = savedData.roles;
        let index = roles.indexOf(role.id);
        if (index === -1) {
          let error = new PermLevelError(`The role ${role.name} does not have the permission level ${level}`);
          return throwError(error);
        }

        roles.splice(index, 1);

        return this.setPermissionsData(guild.id, level, savedData);
      }),
      map((savedData) => savedData.roles.indexOf(role.id) === -1),
    );
  }

  hasPermission(context, commandName) {
    let guildId = context.guild.id;
    let command = this.chaos.getCommand(commandName);

    if (command.ownerOnly && context.author.id !== this.chaos.owner.id) {
      // command is for the owner only.
      this.chaos.logger.debug('Command can only be ran by the bot owner.');
      return of(false);
    }

    if (context.author.id === this.chaos.owner.id) {
      // Bot owner always has permission
      this.chaos.logger.debug('User is bot owner; By-passing permissions');
      return of(true);
    }

    if (context.author.id === context.guild.ownerID) {
      // Guild owner always has permission
      this.chaos.logger.debug('User is guild owner; By-passing permissions');
      return of(true);
    }

    let permissions = [...command.permissions];
    if (command.adminOnly) {
      permissions.push('admin');
    }

    if (permissions.length === 0) {
      // No specified levels, default to true
      this.chaos.logger.debug('Command has no specified permissions.');
      return of(true);
    }

    return from(permissions).pipe(
      tap((level) => this.chaos.logger.debug(`Checking permission level ${level}`)),
      flatMap((level) => this.getPermissionsData(guildId, level).pipe(
        catchError((error) => {
          if (error.name === "PermLevelNotFoundError") {
            this.chaos.logger.debug(`Permission level ${level} does not exist.`);
            return EMPTY;
          } else {
            return throwError(error);
          }
        }),
      )),
      toArray(),
      map((permLevels) => {
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
      }),
    );
  }

  filterHasPermission(context, commandName) {
    return this.hasPermission(context, commandName).pipe(
      tap((allowed) => this.chaos.logger.debug(`filterHasPermission to run ${commandName}: ${allowed}`)),
      catchError((error) => {
        if (error.name === "CommandNotFoundError") {
          return of(false);
        } else {
          return throwError(error);
        }
      }),
      filter(Boolean),
    );
  }
}

module.exports = PermissionsService;
