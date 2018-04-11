const Module = require('../models/module');

class ModuleManager {
  get nix() {
    return this._nix;
  }

  get modules() {
    // replace the keys with the case sensitive names
    return Object.values(this._modules);
  }

  constructor(nix) {
    this._nix = nix;
    this._modules = {};

    //Bind methods for aliasing to NixCore
    this.addModule = this.addModule.bind(this);
    this.getModule = this.getModule.bind(this);

    // Retrieve core services for adding module components
    this.configActionService = this.nix.getService('core', 'configActionService');
    this.commandService = this.nix.getService('core', 'commandService');
    this.permissionsService = this.nix.getService('core', 'permissionsService');
  }

  getModule(moduleName) {
    let module = this._modules[moduleName.toLowerCase()];
    if (!module) {
      let error = new Error(`Module '${moduleName}' could not be found. Has it been added to Nix?`);
      error.name = "ModuleNotFoundError";
      throw error;
    }
    return module;
  }

  addModule(module) {
    module = new Module(module);
    this._modules[module.name.toLowerCase()] = module;

    module.services.forEach((Service) => {
      this.nix.addService(module.name, Service);
    });

    module.configActions.forEach((action) => {
      this.configActionService.addAction(module.name, action);
    });

    module.commands.forEach((command) => {
      command.moduleName = module.name;
      this.commandService.addCommand(command);
    });

    module.permissions.forEach((level) => {
      this.permissionsService.addPermissionLevel(level);
    });
  }
}

module.exports = ModuleManager;
