const ChaosCore = require('../lib/chaos-core');
const config = require('../config.js');

const chaos = new ChaosCore(config);

chaos.addPlugin({
  name: "dummy",
  defaultData: [
    { keyword: "test.dummy", data: null },
  ],
  commands: [
    {
      name: "dummy",
      description: "Test command",
      permissions: ["dummy"],

      run(context, response) {
        return response.send({ content: "Hello World!" });
      },
    }, {
      name: "repeat",
      description: "repeat the input",
      args: [ { name: 'input', greedy: true }],

      run(context, response) {
        return response.send({ content: context.args.input });
      },
    },
  ],
});

chaos.listen();
