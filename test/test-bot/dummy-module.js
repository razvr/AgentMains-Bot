module.exports = {
  name: "dummy",
  commands: [{
    name: "dummy",
    description: "Test command",
    permissions: [ "dummy" ],

    run(context, response) {
      return response.send({ content: "Hello World!" });
    },
  }],
};
