const Clapp = require('../modules/clapp-discord');
const Moment = require('../../node_modules/moment');


module.exports = new Clapp.Command(
  {
    name: "highnoon",
    desc: "What time is it?",
    fn: (argv, context) => {
      //check for highnoon using Momentjs
      if(Moment().format('Hm') == "1200") {
        message = "It's High Noon!";
      }else{
        message = "It's " + Moment().format('LT');
      }

      return {
        message: {
          type: 'message',
          message: message,
        },
        context: context,
      }
    },
  }
);
