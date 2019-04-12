const PermissionsManager = require("../../../lib/managers/permissions-manager");

describe('PermissionsManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.permissionsManager = new PermissionsManager(this.chaos);
  });

  describe(".chaos", function () {
    it('returns the chaos that the manager was created with', function () {
      expect(this.permissionsManager.chaos).to.eq(this.chaos);
    });
  });

  describe('.levels', function () {
    context('when no permission levels have been added', function () {
      it('returns an empty list of permission levels', function () {
        expect(this.permissionsManager.levels).to.deep.eq([]);
      });
    });

    context('when modules have been added', function () {
      beforeEach(function () {
        this.permissionsManager.addPermissionLevel("testOne");
        this.permissionsManager.addPermissionLevel("testTwo");
        this.permissionsManager.addPermissionLevel("testThree");
      });

      it('returns a list of all added modules', function () {
        expect(this.permissionsManager.levels).to.deep.eq([
          "testOne",
          "testTwo",
          "testThree",
        ]);
      });
    });
  });

  describe('constructor', function () {
    it('initializes the manager with an empty permission levels list', function () {
      expect(this.permissionsManager.levels).to.deep.eq([]);
    });
  });

  describe('#addPermissionLevel', function () {
    it('makes the permission level retrievable via #getPermissionLevel', function () {
      this.permissionsManager.addPermissionLevel("testOne");
      expect(this.permissionsManager.getPermissionLevel('testOne')).to.eq("testOne");
    });

    context('when a command with the same name has already been added', function () {
      beforeEach(function () {
        this.permissionsManager.addPermissionLevel("testOne");
      });

      it('does not raise an error', function () {
        expect(() => this.permissionsManager.addPermissionLevel("testOne")).not.to.throw();
      });
    });
  });

  describe('#getPermissionLevel', function () {
    context('when the permission levels has been added', function () {
      beforeEach(function () {
        this.permissionsManager.addPermissionLevel("testOne");
      });

      it('returns the module', function () {
        expect(this.permissionsManager.getPermissionLevel('testOne')).to.eq("testOne");
      });

      it('is case insensitive', function () {
        expect(this.permissionsManager.getPermissionLevel('TESTONE')).to.eq("testOne");
      });
    });

    context('when the permission levels has not been added', function () {
      it('raises an error', function () {
        expect(() => this.permissionsManager.getPermissionLevel('testOne')).to.throw(
          Error, "The permission level 'testOne' could not be found.",
        );
      });
    });
  });
});
