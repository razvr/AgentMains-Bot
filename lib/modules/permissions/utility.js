const DATAKEYS = {
  PERMISSIONS: 'core.permissions',
};

const ERRORS = {
  LEVEL_NOT_FOUND: 'Level is not available',
  HAS_PERMISSION: 'Already has permission level',
  MISSING_PERMISSION: 'Does not have permission level',
};

module.exports = {
  DATAKEYS,
  ERRORS,

  PermissionsService: require('../../services/permissions-service'), //alias for easier access

  findUser (userString, context) {
    return context.guild.members.find((u) => u.toString() === userString);
  },

  findRole(roleString, context) {
    return context.guild.roles.find((role) => {
      if (role.toString() === roleString) {
        return true;
      }
      if (role.name.toLowerCase() === roleString.toLowerCase()) {
        return true;
      }
      if (role.name.toLowerCase() === roleString.toLowerCase().replace(/^@/, '')) {
        return true;
      }
      return false;
    });
  },
};
