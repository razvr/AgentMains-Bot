const Clapp = require('../modules/clapp-discord');
const fs = require('fs');

let foolsInProgress = false;

const USER_DATA_FILE = __dirname + '/../../data/users.json';

module.exports = new Clapp.Command({
  name: "fools",
  desc: "begin the fools",
  fn: (argv, context) => new Promise((resolve, reject) => {
    if(!userIsAdmin(context.msg.member)) {
      console.log('not-admin');
      return resolve({
        message: {
          type: 'message',
          message: 'you not admin',
        },
        context
      });
    }

    if (foolsInProgress) {
      return resolve({
        message: {
          type: 'message',
          message: 'fools in progress...',
        },
        context
      });
    }
    foolsInProgress = true;

    if (!fs.existsSync(USER_DATA_FILE)){
      fs.writeFileSync(USER_DATA_FILE, JSON.stringify({}));
    }

    let userStore = JSON.parse(fs.readFileSync(USER_DATA_FILE));
    let members = context.msg.guild.members;

    let promises = [];

    if (argv.flags['undo']) {
      console.log('restore');
      members.forEach((member) => {
        promises.push(restoreUsername(userStore, member, context.msg.guild));
      });
    }
    else {
      console.log('foolize');
      members.forEach((member) => {
        promises.push(foolizeUsername(userStore, member, context.msg.guild));
      });
    }

    Promise.all(promises)
      .then(() => {
        userStoreJson = JSON.stringify(userStore, null, '  ');

        console.log(userStoreJson);

        fs.writeFileSync(USER_DATA_FILE, userStoreJson);

        foolsInProgress = false;
        resolve({
          message: {
            type: 'message',
            message: 'fools complete',
          },
          context: context,
        });
      })
      .catch((e) => {
        foolsInProgress = false;
        resolve({
          message: {
            type: 'message',
            message: e.toString(),
          },
          context: context,
        });
      })
  }),
  flags: [
    {
      name: 'undo',
      desc: 'undo the fools',
      type: 'boolean',
      default: false,
    }
  ],
});

function userIsAdmin(member) {
  let roles = member.roles;
  let foundRole = roles.find((role) => role.name.toLowerCase() === 'admin');
  return foundRole !== null;
}

function foolizeUsername(usersStore, member, guild) {
  if (typeof usersStore[member.id] === 'undefined') {
    usersStore[member.id] = {}
  }

  let userData = usersStore[member.id];
  if (typeof userData.displayNames === 'undefined') {
    userData.displayNames = {};
  }

  if (typeof userData.displayNames[guild.id] === 'undefined') {
    userData.displayNames[guild.id] = {};
  }

  let userNameSettings = userData.displayNames[guild.id];
  if (userNameSettings.fooled === true) {
    return new Promise((resolve, reject) => resolve());
  }

  let oldNickname = member.displayName;
  let newNickname = 'Sombra-' + (Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase();

  userNameSettings.displayName = oldNickname;
  return setNickname(member, newNickname)
    .then((success) => {
      if (success) {
        userNameSettings.fooled = true;
      }
    });
}

function restoreUsername(usersStore, member, guild) {
  if (typeof usersStore[member.id] === 'undefined') {
    return new Promise((resolve, reject) => resolve());
  }

  let userData = usersStore[member.id];
  let userNameSettings = usersStore[member.id].displayName[guild.id];
  let newNickname = userNameSettings.displayName;

  return setNickname(member, newNickname)
    .then((success) => {
      if(success) {
        userNameSettings.fooled = false;
      }
    });
}

function setNickname(member, newNickname) {
  if (newNickname === member.displayName) {
    console.log('nickname already set');
    return new Promise((resolve, reject) => resolve());
  }

  console.log('setting nickname for', member.displayName, 'to', newNickname);
  return new Promise((reslove, reject) => {
    member.setNickname(newNickname)
      .then(() => reslove(true))
      .catch(() => reslove(false))
  });
}
