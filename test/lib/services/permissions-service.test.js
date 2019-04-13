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
        this.permissionsService.getPermissionsData(this.guild.id, this.level)
          .toArray()
          .catch((error) => {
            expect(error.name).to.eq('PermLevelNotFoundError');
            expect(error.message).to.eq(`The permission level '${this.level}' could not be found.`);
            return Rx.Observable.empty();
          })
          .subscribe(() => done(new Error("Expected an error to be raised")), (error) => done(error), () => done());
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
          this.permissionsService.getPermissionsData(this.guild.id, this.level)
            .toArray()
            .map(() => {
              expect(this.chaos.setGuildData).to.have.been.calledWith(
                this.guild.id,
                `core.permissions.${this.level}`,
                { name: "admin", users: [], roles: [] },
              );
            })
            .subscribe(() => done(), (error) => done(error));
        });

        it('emits a default set of data', function (done) {
          this.permissionsService
            .getPermissionsData(this.guild.id, this.level)
            .toArray()
            .do((emitted) => {
              expect(emitted).to.deep.equal([
                { name: 'admin', users: [], roles: [] },
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
          this.permissionsService.getPermissionsData(this.guild.id, this.level)
            .toArray()
            .map((emitted) => expect(emitted).to.deep.eq([this.data]))
            .subscribe(() => done(), (error) => done(error));
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
        this.permissionsService.setPermissionsData(this.guild.id, this.level, this.data)
          .toArray()
          .catch((error) => {
            expect(error.name).to.eq('PermLevelNotFoundError');
            expect(error.message).to.eq(`The permission level '${this.level}' could not be found.`);
            return Rx.Observable.empty();
          })
          .subscribe(() => done(new Error("Expected an error to be raised")), (error) => done(error), () => done());
      });
    });

    context('when the permission level is known', function () {
      beforeEach(function () {
        this.level = "admin";
        this.chaos.addPermissionLevel(this.level);
      });

      it('saves the passed data to the guild data', function (done) {
        sinon.spy(this.chaos, 'setGuildData');
        this.permissionsService.setPermissionsData(this.guild.id, this.level, this.data)
          .toArray()
          .map(() => {
            expect(this.chaos.setGuildData).to.have.been.calledWith(
              this.guild.id,
              `core.permissions.${this.level}`,
              this.data,
            );
          })
          .subscribe(() => done(), (error) => done(error));
      });

      it('emits the saved data', function (done) {
        this.permissionsService.setPermissionsData(this.guild.id, this.level, this.data)
          .toArray()
          .map((emitted) => expect(emitted).to.deep.eq([this.data]))
          .subscribe(() => done(), (error) => done(error));
      });
    });
  });

  describe('#addUser', function () {
    beforeEach(function () {
      this.guild = { id: "guild-00001" };
      this.level = "admin";
      this.user = { id: "user-00001", username: "exampleUser" };

      this.permissionsService.levels = ["admin"];
    });

    it('adds the user to the given permission level', function (done) {
      sinon.stub(this.permissionsService, 'setPermissionsData')
        .callsFake((guildId, level, data) => Rx.Observable.of(data));

      this.permissionsService.addUser(this.guild, this.level, this.user)
        .toArray()
        .map(() => {
          expect(this.permissionsService.setPermissionsData).to.have.been.calledWith(
            this.guild.id,
            this.level,
            {
              name: 'admin',
              users: [this.user.id],
              roles: [],
            },
          );
        })
        .subscribe(() => done(), (error) => done(error));
    });

    context('when the permission level does not exist', function () {
      beforeEach(function () {
        this.level = "foobar";
      });

      it('raises a PermLevelNotFoundError', function (done) {
        this.permissionsService.addUser(this.guild, this.level, this.user)
          .toArray()
          .catch((error) => {
            expect(error.name).to.eq('PermLevelNotFoundError');
            expect(error.message).to.eq(`The permission level '${this.level}' could not be found.`);
            return Rx.Observable.empty();
          })
          .subscribe(() => done(new Error("Expected an error to be raised")), (error) => done(error), () => done());
      });
    });

    context('when the user has already been added to the permission level', function () {
      beforeEach(function () {
        sinon.stub(this.permissionsService, 'getPermissionsData').returns(Rx.Observable.of({
          users: [this.user.id],
          roles: [],
        }));
      });

      it('raises a PermLevelError', function (done) {
        this.permissionsService.addUser(this.guild, this.level, this.user)
          .toArray()
          .catch((error) => {
            expect(error.name).to.eq('PermLevelError');
            expect(error.message).to.eq(`The user ${this.user.username} already has the permission level ${this.level}`);
            return Rx.Observable.empty();
          })
          .subscribe(() => done(new Error("Expected an error to be raised")), (error) => done(error), () => done());
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
})
;
