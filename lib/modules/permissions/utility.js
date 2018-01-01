module.exports = {
  PermissionsManager: require('../../managers/permissions-manager'), //alias for easier access

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
  }
};
