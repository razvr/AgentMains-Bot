module.exports = {
  boop: [
    'Boop.',
    'Boop ;)',
    'Boop!',
    'Boop?',
  ],
  region: {
    roleNotFound: (role) => (
      'Sorry, but I wasn\'t able to set your region. Can you ask an admin to check that the' +
      ' role \'' + role + '\' exists?'
    ),
    regionNotFound: (allRegions, requestedRegion) => {
      let availableRegions = [...allRegions]
        .map(r => r.role + ' (' + r.names.join(', ') + ')')
        .join('\n');

      return (
        'I\'m sorry, but \'' + requestedRegion + '\' is not an available region.\n' +
        '\n' +
        'These regions are available:\n' +
        availableRegions
      )
    },
    roleAlreadySet: (role) => (
      'Your region is already set to ' + role
    ),
    couldNotRemoveRole: () => (
      'Sorry, but I wasn\'t able to set your region. Can you ask an admin to check my permissions?' +
      ' I need to be able remove roles from users.'
    ),
    couldNotAddRole: () => (
      'Sorry, but I wasn\'t able to set your region. Can you ask an admin to check my permissions?' +
      ' I need to be able add roles to users.'
    ),
    roleSet: (roleName) => (
      'I\'ve set your region to ' + roleName
    ),
  }
};
