module.exports = {
  name: 'permissions',
  canBeDisabled: false,
  defaultData: [],
  configActions: [
    require('./config/list'),
    require('./config/addUser'),
    require('./config/rmUser'),
    require('./config/addRole'),
    require('./config/rmRole'),
  ],
  commands: [],
};



