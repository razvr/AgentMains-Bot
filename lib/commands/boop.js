const Clapp = require('../modules/clapp-discord');
const utilties = require('../utlities');

module.exports = new Clapp.Command(
  {
    name: "boop",
    desc: "Boop",
    fn: () => {
      return utilties.getRandomResponse('boop');
    }
  }
);
