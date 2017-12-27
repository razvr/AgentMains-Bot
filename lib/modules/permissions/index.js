module.exports = {
  name: 'permissions',
  defaultData: [
    {
      keyword: 'core.permissions',
      data: {
        admin: {users: [], roles: []},
        mod: {users: [], roles: []},
      },
    },
  ],
  configActions: [
    require('./config/addUser'),
    require('./config/rmUser'),
    require('./config/addRole'),
    require('./config/rmRole'),
  ],
  commands: [],
};



