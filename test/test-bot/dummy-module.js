module.exports = {
  name: "dummy",
  commands: [{
    name: "dummy",
    description: "Test command",
    permissions: [ "dummy" ],

    run() {},
  }],
  onNixListen() {
  },
  onNixJoinGuild() {
  },
};
