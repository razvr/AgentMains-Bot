const responses = require('../data/responses');

module.exports = {
  getRandomResponse: function(command) {
    let list = responses[command];
    return list[Math.floor(Math.random() * list.length)];
  }
};
