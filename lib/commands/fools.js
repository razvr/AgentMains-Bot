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
        promises.push(restoreUsername(userStore, member));
      });
    }
    else {
      console.log('foolize');
      members.forEach((member) => {
        promises.push(foolizeUsername(userStore, member));
      });
    }

    Promise.all(promises)
      .then(() => {
        console.log(userStore);

        fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userStore));

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

function foolizeUsername(usersStore, member) {
  if (typeof usersStore[member.id] === 'undefined') {
    usersStore[member.id] = {}
  }

  if (usersStore[member.id].fooled === true) {
    return new Promise((resolve, reject) => resolve());
  }

  let oldNickname = member.displayName;
  let newNickname = 'Sombra-' + (Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase();

  return setNickname(member, newNickname)
    .then(() => {
      usersStore[member.id].displayName = oldNickname;
      usersStore[member.id].fooled = true;
    });
}

function restoreUsername(usersStore, member) {
  if (typeof usersStore[member.id] === 'undefined') {
    return new Promise((resolve, reject) => resolve());
  }

  let newNickname = usersStore[member.id].displayName;

  return setNickname(member, newNickname)
    .then(() => {
      usersStore[member.id].fooled = false;
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
      .then(reslove)
      .catch(reslove)
  });
}
