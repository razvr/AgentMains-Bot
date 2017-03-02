'use strict';

const fs = require('fs');
const Clapp = require('./modules/clapp-discord');
const cfg = require('../config.js');
const pkg = require('../package.json');
const Discord = require('discord.js');
const msgStrings = require('./modules/clapp-discord/str-en');
const bot = new Discord.Client();

var app = new Clapp.App(
  {
    name: cfg.name,
    desc: pkg.description,
    prefix: cfg.prefix,
    separator: cfg.separator,
    version: pkg.version,
    onReply: (msg, context) => {
      // Fired when input is needed to be shown to the user.

      console.log(msg);

      context.msg.reply(msg)
        .then(
          bot_response => {
            if (cfg.deleteAfterReply.enabled) {
              context.msg.delete(cfg.deleteAfterReply.time)
                .then(msg => console.log(`Deleted message from ${msg.author}`))
                .catch(console.log);
              bot_response.delete(cfg.deleteAfterReply.time)
                .then(msg => console.log(`Deleted message from ${msg.author}`))
                .catch(console.log);
            }
          }
        )
        .catch(
          error_response => {
            replyInternalError(msg, error_response);
          }
        );
    }
  }
);

// Load every command in the commands folder
fs.readdirSync('./lib/commands/').forEach(
  file => {
    app.addCommand(require("./commands/" + file));
  }
);

bot.on(
  'message', msg => {
    try {
      // Fired when someone sends a message

      if (app.isCliSentence(msg.content)) {
        let helpCmd = cfg.prefix + cfg.separator + 'help';

        if (msg.content === helpCmd) {
          msg.content = cfg.prefix + cfg.separator + '--help';
        }

        app.parseInput(
          msg.content, {
            msg: msg,
            member: msg.member,
            guild: msg.guild,
          }
        );
      }
    }
    catch (e) {
      replyInternalError(msg, e);
    }
  }
);

bot.login(cfg.token).then(
  () => {
    console.log('Running!');
  }
);

function replyInternalError(msg, error) {
  let errorToken = (Math.random() + 1).toString(16).substr(2, 5);

  msg.reply(
    msgStrings.err + msgStrings.err_internal_error + '\nIf you see SpyMaster356,' +
    ' tell him to look for this in my logs: ' + errorToken
  );

  console.error('Error Token: ' + errorToken);
  console.error(error);
}
