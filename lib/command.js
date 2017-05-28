const Rx = require('rx');

const Response = require('./response');

class Command {
  constructor(options) {
    this.name = 'Name';
    this.description = '\u200B';

    this.run = (message, response) => {
      response.type = Response.TYPE_NONE;
      return Rx.Observable.just(response)
    };
    this.adminOnly = false;
    this.args = [];

    Object.assign(this, options);
  }

  get requiredArgs() {
    return this.args.filter((arg) => arg.required);
  }

  helpResponse() {
    let argsList = [];
    let usage = '!' + this.name;

    if (this.args.length >= 1) {
      this.args.forEach((arg) => {
        if (arg.required) {
          usage += ' <' + arg.name + '>';
          argsList.push('**' + arg.name + '**: ' + arg.description);
        } else {
          usage += ' [' + arg.name + ']';
          argsList.push('*' + arg.name + '*: (optional) ' + arg.description);
        }

      });
    }

    let response = new Response(Response.TYPE_EMBED);
    response.embed.setTitle(this.name);
    response.embed.setDescription(this.description);
    response.embed.addField('Usage', usage);
    response.embed.addField('Arguments', argsList.join('\n'));

    return response;
  }
}

module.exports = Command;
