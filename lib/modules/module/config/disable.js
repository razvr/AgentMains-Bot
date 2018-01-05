const Rx = require('rx');

const ModuleService = require('../../../services/module-service');

module.exports = {
  name: "disable",
  description: 'disable a module',
  inputs: [
    {
      name: 'module',
      description: 'the name of the module to disable',
      required: true,
    },
  ],
  run: (context, response) => {
    let nix = context.nix;
    let moduleName = context.args.input1;

    if (!moduleName) {
      return response.send({content: "A module name is required"});
    }

    if (!nix.moduleService.modules[moduleName]) {
      return response.send({content: `The module ${moduleName} does not exist`});
    }

    return nix.moduleService
      .disableModule(context.guild.id, moduleName)
      .flatMap((isEnabled) => {
        if (isEnabled) { return Rx.Observable.throw(new Error("Unable to disable module")); }
        return response.send(`The module ${moduleName} is now disabled.`);
      })
      .catch((error) => {
        if (error.message === ModuleService.ERRORS.MODULE_ALREADY_DISABLED) {
          return response.send({content: `The module ${moduleName} is already disabled`});
        }
        else if (error.message === "Unable to disable module") {
          nix.messageOwner('I was unable to disable a module', {embed: nix.createErrorEmbed(context, error)});
          return response.send({content: 'I was not able disable the module.'});
        }
        else {
          throw error;
        }
      });
  },
};
