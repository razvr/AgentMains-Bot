const Rx = require('rx');
const { onNext, onCompleted, onError } = Rx.ReactiveTest;

const PermissionsService = require('../../../lib/services/permissions-service');
const { DATAKEYS } = require('../../../lib/modules/permissions/utility');

describe('PermissionsService', function () {
  beforeEach(function () {
    this.nix = createNixStub();
    this.permissionsService = new PermissionsService(this.nix);
  });

  describe('constructor', function () {
    it('sets an empty list of permission levels', function () {
      expect(this.permissionsService.levels).to.be.empty;
    });
  });

  describe('#getDatakey', function () {
    beforeEach(function () {
      this.level = "testLevel";
    });

    it('returns a datakey for the permission level', function () {
      expect(this.permissionsService.getDatakey(this.level)).to.eq(`core.permissions.${this.level}`);
    });
  });

  describe('#getPermissionsData', function () {
    beforeEach(function () {
      this.guild = { id: 'guild-00001' };
    });

    context('when the permission level is unknown', function () {
      beforeEach(function () {
        this.level = "foobar";
      });

      it('raises a PermissionLevelNotFound error', function (done) {
        expect(this.permissionsService.getPermissionsData(this.guild.id, this.level))
          .to.throw(Error)
          .and.close(done);
      });
    });

    context('when the permission level is known', function () {
      beforeEach(function () {
        this.level = "admin";
        this.permissionsService.levels = [this.level];
      });

      context('when there is no data for the level', function () {
        beforeEach(function () {
          sinon.stub(this.nix, 'getGuildData').returns(Rx.Observable.of(null));
        });

        it('saves a default set of data', function (done) {
          sinon.spy(this.nix, 'setGuildData');
          expect(this.permissionsService.getPermissionsData(this.guild.id, this.level))
            .to.complete(done, () => {
              expect(this.nix.setGuildData).to.have.been.calledWith(
                this.guild.id,
                `core.permissions.${this.level}`,
                { users: [], roles: [] }
              );
            });
        });

        it('emits a default set of data', function (done) {
          expect(this.permissionsService.getPermissionsData(this.guild.id, this.level))
            .to.emit([{ users: [], roles: [] }])
            .and.complete(done);
        });
      });

      context('when previous data exists for the level', function () {
        beforeEach(function () {
          this.data = {
            users: ["user1"],
            roles: ["role1"],
          };
          sinon.stub(this.nix, 'getGuildData').returns(Rx.Observable.of(this.data));
        });

        it('emits the saved data', function (done) {
          expect(this.permissionsService.getPermissionsData(this.guild.id, this.level))
            .to.emit([this.data])
            .and.complete(done);
        });
      });
    });
  });

  describe('#setPermissionsData', function () {
    beforeEach(function () {
      this.guild = { id: 'guild-00001' };
      this.level = "admin";
      this.data = {
        users: ["user1"],
        roles: ["role1"],
      };
    });

    context('when the permission level is unknown', function () {
      beforeEach(function () {
        this.level = "foobar";
      });

      it('raises a PermissionLevelNotFound error', function (done) {
        expect(this.permissionsService.setPermissionsData(this.guild.id, this.level, this.data))
          .to.throw(Error)
          .and.close(done);
      });
    });

    context('when the permission level is known', function () {
      beforeEach(function () {
        this.level = "admin";
        this.permissionsService.levels = [this.level];
      });

      it('saves the passed data to the guild data', function (done) {
        sinon.spy(this.nix, 'setGuildData');
        expect(this.permissionsService.setPermissionsData(this.guild.id, this.level, this.data))
          .to.complete(done, () => {
          expect(this.nix.setGuildData).to.have.been.calledWith(
            this.guild.id,
            `core.permissions.${this.level}`,
            this.data
          );
        });
      });

      it('emits the saved data', function (done) {
        expect(this.permissionsService.setPermissionsData(this.guild.id, this.level, this.data))
          .to.emit([this.data])
          .and.complete(done);
      });
    });
  });

  describe('#addPermissionLevel', function () {

  });

  describe('#addUser', function () {

  });

  describe('#removeUser', function () {

  });

  describe('#addRole', function () {

  });

  describe('#removeRole', function () {

  });

  describe('#hasPermission', function () {

  });

  describe('#filterHasPermission', function () {

  });
});
