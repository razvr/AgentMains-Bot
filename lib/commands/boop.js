const Clapp = require('../modules/clapp-discord');
const utilties = require('../utlities');

module.exports = new Clapp.Command(
  {
    name: "boop",
    desc: "Boop",
    fn: (argv, context) => {
      return {
        message: {
          type: 'message',
          message: utilties.getRandomResponse('boop'),
        },
        context: context,
      }
    },
  }
);
