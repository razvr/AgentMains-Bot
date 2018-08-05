const Rx = require('rx');
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

  describe(".nix", function () {
    it('returns the instance of nix the service was constructed with', function () {
      expect(this.service.nix).to.eq(this.nix);
    });
  });

  describe("#configureService", function () {
    it("returns an Observable of true", function (done) {
      let hook$ = this.service.configureService();
      expect(hook$).to.be.an.instanceOf(Rx.Observable);

      hook$.subscribe(
        (value) => {
          expect(value).to.eq(true);
          done();
        },
        (error) => {
          done(error);
        }
      );
    });
  });

  describe("#onNixListen", function () {
    it("returns an Observable of true", function (done) {
      let hook$ = this.service.onNixListen();
      expect(hook$).to.be.an.instanceOf(Rx.Observable);

      hook$.subscribe(
        (value) => {
          expect(value).to.eq(true);
          done();
        },
        (error) => {
          done(error);
        }
      );
    });
  });

  describe("#onNixJoinGuild", function () {
    it("returns an Observable of true", function (done) {
      let hook$ = this.service.onNixJoinGuild();
      expect(hook$).to.be.an.instanceOf(Rx.Observable);

      hook$.subscribe(
        (value) => {
          expect(value).to.eq(true);
          done();
        },
        (error) => {
          done(error);
        }
      );
    });
  });
});
