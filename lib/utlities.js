const reponses = require('../data/responses');

module.exports = {
  getRandomResponse: function(command) {
    let list = reponses[command];
    return list[Math.floor(Math.random() * list.length)];
  }
};
