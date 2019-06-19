const ChaosComponent = require('./chaos-component');

class Service extends ChaosComponent {
  /**
   * Get the name of this service. Used when retrieving the service via chaos.getService();
   * Defaults to the name of the class.
   *
   * @returns {*}
   */
  get name() {
    return this.constructor.name;
  }
}

module.exports = Service;
