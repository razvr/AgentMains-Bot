const sinon = require('sinon');
const Discord = require('discord.js');

const Factory = require('../support/factory');

Factory.define('User', (options) => {
  let userData = Object.assign({
    id: Factory.sequence((i) => `userId-${i}`),
  }, options);

  let user = new Discord.User({}, userData);

  // Stub out networked methods
  user.addFriend = sinon.stub().resolves(user);
  user.block = sinon.stub().resolves(user);
  user.createDM = sinon.stub().resolves({});
  user.deleteDM = sinon.stub().resolves({});
  user.fetchProfile = sinon.stub().resolves({});
  user.removeFriend = sinon.stub().resolves(user);
  user.send = sinon.stub().callsFake((msg) => new Promise((resolve) => resolve(msg)));
  user.setNote = sinon.stub().resolves(user);
  user.unblock = sinon.stub().resolves(user);

  return user;
});
