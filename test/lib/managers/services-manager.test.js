const Rx = require('rx');

const ServicesManager = require('../../../lib/managers/services-manager');
const Service = require("../../../lib/models/service");
const MockNixLogger = require("../../support/mock-logger");

describe('ServicesManager', function () {
  beforeEach(function () {
    this.services = {
      core: {
        serviceOne: {name: "serviceOne"},
        serviceTwo: {name: "serviceTwo"},
      },
    };

    this.nix = {
      logger: new MockNixLogger(),
      getService: (module, serviceName) => this.services[module][serviceName],
      config: {key: "value"},
    };

    this.servicesManager = new ServicesManager(this.nix);
  });

  describe('constructor', function () {
    it('initializes .services to an empty object', function () {
      expect(this.servicesManager.services).to.be.empty;
    });
  });

  describe('.services', function () {
    context('when no services have been added to the manager', function () {
      it('returns an empty list', function () {
        expect(this.servicesManager.services).to.be.empty;
      });
    });

    context('when services have been added to the manager', function () {
      class ServiceOne extends Service {
      }

      class ServiceTwo extends Service {
      }

      class ServiceThree extends Service {
      }

      beforeEach(function () {
        this.servicesManager.addService('test', ServiceOne);
        this.servicesManager.addService('test', ServiceTwo);
        this.servicesManager.addService('test', ServiceThree);
      });

      it("returns a list of all added services", function () {
        expect(this.servicesManager.services).to.have.lengthOf(3);
        let services = this.servicesManager.services.map((service) => service.name);
        expect(services).to.have.members([
          "ServiceOne",
          "ServiceTwo",
          "ServiceThree",
        ]);
      });
    });
  });

  describe('#addService', function () {
    class TestService extends Service {
    }

    it('makes the service retrievable via #getService', function () {
      this.servicesManager.addService('test', TestService);
      expect(this.servicesManager.getService('test', 'TestService')).to.be.an.instanceof(TestService);
    });

    it('initializes the service with a reference to nix', function () {
      this.servicesManager.addService('test', TestService);
      let testService = this.servicesManager.getService('test', 'TestService');
      expect(testService.nix).to.eq(this.nix);
    });

    context('when the service has already been added', function () {
      beforeEach(function () {
        this.servicesManager.addService('test', TestService);
      });

      it('raises an error', function () {
        expect(() => this.servicesManager.addService('test', TestService)).to.throw(
          Error, "The service 'test.TestService' has already been added."
        );
      });
    });
  });

  describe('#getService', function () {
    class TestService extends Service {
    }

    context('when the service has been added to the manager', function () {
      beforeEach(function () {
        this.servicesManager.addService('test', TestService);
      });

      it('returns the requested service', function () {
        expect(this.servicesManager.getService('test', 'TestService')).to.be.an.instanceof(TestService);
      });
    });

    context('when the service has not been added to the manager', function () {
      it('raises an error', function () {
        expect(() => this.servicesManager.getService('test', 'TestService')).to.throw(
          Error, "The service 'test.TestService' could not be found"
        );
      });
    });
  });

  describe('#configureServices', function () {
    context('when services have been added to the manager', function () {
      class ConfigrableService extends Service {
        configureService(config) {
          this.configured = true;
          this.configuredWith = config;

          return Rx.Observable.of(true);
        }
      }

      class ServiceOne extends ConfigrableService {
      }

      class ServiceTwo extends ConfigrableService {
      }

      class ServiceThree extends ConfigrableService {
      }

      beforeEach(function () {
        this.servicesManager.addService('test', ServiceOne);
        this.servicesManager.addService('test', ServiceTwo);
        this.servicesManager.addService('test', ServiceThree);
      });

      it('configures all services', function (done) {
        this.servicesManager
          .configureServices()
          .subscribe(
            () => {
              let services = [
                this.servicesManager.getService('test', 'ServiceOne'),
                this.servicesManager.getService('test', 'ServiceTwo'),
                this.servicesManager.getService('test', 'ServiceThree'),
              ];

              expect(services.every((service) => service.configured)).to.eq(true);
              expect(services.every((service) => service.configuredWith === this.nix.config)).to.eq(true);

              done();
            },
            (error) => {
              done(error);
            }
          );
      });
    });
  });

  describe('#injectDependencies', function () {
    context('when there are no service added', function () {
      it('does not add raise an error', function () {
        expect(() => this.servicesManager.injectDependencies()).to.not.throw();
      });
    });

    context('when there are services added', function () {
      beforeEach(function () {
        class TestServiceOne extends Service {
          constructor(nix) {
            super(nix);

            this.services = {
              core: [
                "serviceOne",
              ],
            };
          }
        }

        class TestServiceTwo extends Service {
          constructor(nix) {
            super(nix);

            this.services = {
              core: [
                "serviceTwo",
              ],
            };
          }
        }

        class TestServiceThree extends Service {
          constructor(nix) {
            super(nix);

            this.services = {
              core: [
                "serviceOne",
                "serviceTwo",
              ],
            };
          }
        }

        this.testServiceOne = TestServiceOne;
        this.testServiceTwo = TestServiceTwo;
        this.testServiceThree = TestServiceThree;

        this.servicesManager.addService("test", TestServiceOne);
        this.servicesManager.addService("test", TestServiceTwo);
        this.servicesManager.addService("test", TestServiceThree);
      });

      it('injects the requested services', function () {
        this.servicesManager.injectDependencies();

        let testServiceOne = this.servicesManager.getService("test", "testServiceOne");
        expect(testServiceOne.serviceOne).to.eq(this.services.core.serviceOne);
        expect(testServiceOne.serviceTwo).to.be.undefined;

        let testServiceTwo = this.servicesManager.getService("test", "testServiceTwo");
        expect(testServiceTwo.serviceOne).to.be.undefined;
        expect(testServiceTwo.serviceTwo).to.eq(this.services.core.serviceTwo);

        let testServiceThree = this.servicesManager.getService("test", "testServiceThree");
        expect(testServiceThree.serviceOne).to.eq(this.services.core.serviceOne);
        expect(testServiceThree.serviceTwo).to.eq(this.services.core.serviceTwo);
      });
    });
  });
});
