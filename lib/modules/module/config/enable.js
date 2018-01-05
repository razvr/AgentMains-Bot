const Rx = require('rx');

const ModuleService = require('../../../services/module-service');

module.exports = {
  name: "enable",
  description: 'enable a module',
  inputs: [
    {
      name: 'module',
      description: 'the name of the module to enable',
      required: true,
    },
  ],
  run: (context, response) => {
    let nix = context.nix;
    let moduleName = context.args.input1;

    if (!moduleName) {
      return response.send({content: "A module name is required"});
    }

    return nix.moduleService
      .enableModule(context.guild.id, moduleName)
      .flatMap((isEnabled) => {
        if (!isEnabled) { return Rx.Observable.throw(new Error("Unable to enable module")); }
        return response.send(`The module ${moduleName} is now enabled.`);
      })
      .catch((error) => {
        switch (error.message) {
          case ModuleService.ERRORS.MODULE_NOT_FOUND:
            return response.send({content: `The module ${moduleName} does not exist`});
          case ModuleService.ERRORS.MODULE_ALREADY_ENABLED:
            return response.send({content: `The module ${moduleName} is already enabled`});
          case "Unable to enable module":
            nix.messageOwner('I was unable to enable a module', {embed: this.createErrorEmbed(context, error)});
            return response.send({content: 'I was not able enable the module.'});
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
