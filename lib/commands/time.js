const Clapp = require('../modules/clapp-discord');
const Moment = require('../../node_modules/moment');


module.exports = new Clapp.Command(
  {
    name: "time",
    desc: "What time is it?",
    fn: (argv, context) => {
      //Hm is hours in 24 hour format, m is minutes so 1200 = 12:00pm
      //if statement true when time is between 12:00 and 12:01
      //MomentJS reference https://momentjs.com/docs/#/displaying/ 
      if(Moment().format('Hm') == "1200") {
        message = "It's High Noon!";
      }else{
        //LT = Local Time, format is '12:01 PM'
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
