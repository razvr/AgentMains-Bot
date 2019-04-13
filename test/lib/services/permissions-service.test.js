const Rx = require('rx');

const PermissionsService = require('../../../lib/core-plugin/services/permissions-service');
const createChaosStub = require('../../support/create-chaos-stub');

describe('PermissionsService', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.permissionsService = new PermissionsService(this.chaos);
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
          .to.throw(Error, {
            name: 'PermLevelNotFoundError',
            message: `The permission level '${this.level}' could not be found.`,
          })
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
          sinon.stub(this.chaos, 'getGuildData').returns(Rx.Observable.of(null));
        });

        it('saves a default set of data', function (done) {
          sinon.spy(this.chaos, 'setGuildData');
          expect(this.permissionsService.getPermissionsData(this.guild.id, this.level))
            .to.complete(done, () => {
              expect(this.chaos.setGuildData).to.have.been.calledWith(
                this.guild.id,
                `core.permissions.${this.level}`,
                { users: [], roles: [] },
              );
            });
        });

        it('emits a default set of data', function (done) {
          this.permissionsService
            .getPermissionsData(this.guild.id, this.level)
            .toArray()
            .do((emitted) => {
              expect(emitted).to.deep.equal([
                {
                  name: 'admin',
                  users: [],
                  roles: [],
                },
              ]);
            })
            .subscribe(() => done(), (error) => done(error));
        });
      });

      context('when previous data exists for the level', function () {
        beforeEach(function () {
          this.data = {
            users: ["user1"],
            roles: ["role1"],
          };
          sinon.stub(this.chaos, 'getGuildData').returns(Rx.Observable.of(this.data));
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

      it('raises a PermLevelNotFoundError error', function (done) {
        expect(this.permissionsService.setPermissionsData(this.guild.id, this.level, this.data))
          .to.throw(Error, {
            name: 'PermLevelNotFoundError',
            message: `The permission level '${this.level}' could not be found.`,
          })
          .and.close(done);
      });
    });

    context('when the permission level is known', function () {
      beforeEach(function () {
        this.level = "admin";
        this.chaos.addPermissionLevel(this.level);
      });

      it('saves the passed data to the guild data', function (done) {
        sinon.spy(this.chaos, 'setGuildData');
        expect(this.permissionsService.setPermissionsData(this.guild.id, this.level, this.data))
          .to.complete(done, () => {
          expect(this.chaos.setGuildData).to.have.been.calledWith(
            this.guild.id,
            `core.permissions.${this.level}`,
            this.data,
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

  describe('#addUser', function () {
    beforeEach(function () {
      this.guild = {id: "guild-00001"};
      this.level = "admin";
      this.user = {id: "user-00001", username: "exampleUser"};

      this.permissionsService.levels = ["admin"];
    });

    it('adds the user to the given permission level', function (done) {
      sinon.stub(this.permissionsService, 'setPermissionsData')
        .callsFake((guildId, level, data) => Rx.Observable.of(data));

      expect(this.permissionsService.addUser(this.guild, this.level, this.user))
        .to.complete(done, () => {
          expect(this.permissionsService.setPermissionsData).to.have.been.calledWith(
            this.guild.id,
            this.level,
            {
              users: [this.user.id],
              roles: [],
            },
          );
        });
    });

    context('when the permission level does not exist', function() {
      beforeEach(function () {
        this.level = "foobar";
      });

      it('raises a PermLevelNotFoundError', function (done) {
        expect(this.permissionsService.addUser(this.guild, this.level, this.user))
          .to.throw(Error, {
            name: 'PermLevelNotFoundError',
            message: `The permission level '${this.level}' could not be found.`,
          })
          .and.close(done);
      });
    });

    context('when the user has already been added to the permission level', function() {
      beforeEach(function () {
        sinon.stub(this.permissionsService, 'getPermissionsData').returns(Rx.Observable.of({
          users: [this.user.id],
          roles: [],
        }));
      });

      it('raises a PermLevelError', function (done) {
        expect(this.permissionsService.addUser(this.guild, this.level, this.user))
          .to.throw(Error, {
            name: 'PermLevelError',
            message: `The user ${this.user.username} already has the permission level ${this.level}`,
          })
          .and.close(done);
      });
    });
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
