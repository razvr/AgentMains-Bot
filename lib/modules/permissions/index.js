module.exports = {
  name: 'permissions',
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



