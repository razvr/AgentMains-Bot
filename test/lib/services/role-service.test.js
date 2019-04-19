const Rx = require('rx');

const RoleService = require('../../../lib/core-plugin/services/role-service');
const { RoleNotFoundError } = require("../../../lib/errors");
const createChaosStub = require('../../create-chaos-stub');
const mocks = require('../../mocks');

describe('Service: RoleService', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.chaos.discord = new mocks.discord.Client({});
    this.roleService = new RoleService(this.chaos);
  });

  describe('#findMember', function () {
    const roleId = '000001';
    const roleName = 'testRole';

    beforeEach(function () {
      this.guild = new mocks.discord.Guild({
        client: this.chaos.discord,
      });
    });

    Object.entries({
      "an role id": roleId,
      "an role mention": `<@&${roleId}>`,
      "an role name": roleName,
    }).forEach(([roleStringType, roleString]) => {
      context(`when the roleString is a ${roleStringType}`, function () {
        context('when the role does not exist', function () {
          it('throws a RoleNotFoundError', function (done) {
            this.roleService.findRole(this.guild, roleString)
              .catch((error) => {
                expect(error).to.be.an.instanceOf(RoleNotFoundError);
                expect(error.message).to.eq(`The role '${roleString}' could not be found`);
                return Rx.Observable.empty();
              })
              .subscribe(() => done(new Error('Error was not raised')), (error) => done(error), () => done());
          });
        });

        context('when the role exists in the guild', function () {
          beforeEach(function () {
            this.role = new mocks.discord.Role({
              guild: this.guild,
              data: {
                id: roleId,
                name: roleName,
              },
            });
          });

          it('emits the found member', function (done) {
            this.roleService.findRole(this.guild, roleString)
              .map((role) => expect(role).to.eq(this.role))
              .subscribe(() => done(), (error) => done(error));
          });
        });
      });
    });
  });
});