const Path = require('path');

module.exports = {
  ownerUserId: "ownerUserId",
  loginToken: "loginToken",

  dataSource: {
    type: 'disk',
    dataDir: Path.join(__dirname, '../dataService'),
  },
};
