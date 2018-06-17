const DATAKEYS = {
  PERMISSIONS: 'core.permissions',
};

module.exports = {
  DATAKEYS,

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
