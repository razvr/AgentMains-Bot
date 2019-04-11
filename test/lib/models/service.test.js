const Service = require("../../../lib/models/service");

describe('Service', function () {
  beforeEach(function () {
    this.nix = {};
    this.service = new Service(this.nix);
  });

  describe(".name", function () {
    it('returns the service name', function () {
      expect(this.service.name).to.eq('Service');
    });

    context('when the model was extended', function() {
      beforeEach(function () {
        class TestService extends Service {}
        this.service = new TestService(this.nix);
      });

      it('returns the service name', function () {
        expect(this.service.name).to.eq('TestService');
      });
    });
  });

  describe(".chaos", function () {
    it('returns the instance of ChaosCore the service was constructed with', function () {
      expect(this.service.chaos).to.eq(this.nix);
    });
  });
});
