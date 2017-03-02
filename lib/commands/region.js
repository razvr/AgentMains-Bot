var Clapp = require('../modules/clapp-discord');

module.exports = new Clapp.Command({
  name: "region",
  desc: "sets region",
  fn: (argv, context) => {
    // This output will be redirected to your app's onReply function
    return 'Foo was executed!' + ' The value of testarg is: ' + argv.args.testarg +
      (argv.flags.testflag ? ' testflag was passed!' : '');
  },
  args: [
    {
      name: 'region',
      desc: 'A test argument',
      type: 'string',
      required: true,
      default: null
    }
  ],
  flags: []
});
