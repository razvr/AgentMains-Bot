const Path = require('path');

const privateConfig = require('./config/private.js');
const games = require('./config/games');

module.exports = {
  loginToken: privateConfig.loginToken,
  ownerUserId: privateConfig.ownerUserId,
  games: games,
  dataDir: Path.join(__dirname, './data'),
};
