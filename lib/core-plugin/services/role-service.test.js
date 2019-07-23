const { EMPTY } = require('rxjs/index');
const { catchError, tap } = require('rxjs/operators/index');

const RoleService = require('./role-service');
const { RoleNotFoundError } = require("../../errors");
const createChaosStub = require('../../test/create-chaos-stub');
const { MockGuild, MockClient, MockRole } = require("../../test/mocks/discord.mocks");

describe('Service: RoleService', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.chaos.discord = new MockClient({});
    this.roleService = new RoleService(this.chaos);
  });

  describe('#findRole', function () {
    const roleId = '000001';
    const roleName = 'testRole';

    beforeEach(function () {
      this.guild = new MockGuild({
        client: this.chaos.discord,
      });
    });

    Object.entries({
      "a role id": roleId,
      "a basic role mention": `<@${roleId}>`,
      "an alternate role mention": `<@&${roleId}>`,
      "a role name": roleName,
    }).forEach(([roleStringType, roleString]) => {
      context(`when the roleString is a ${roleStringType}`, function () {
        context('when the role does not exist', function () {
          it('throws a RoleNotFoundError', function (done) {
            this.roleService.findRole(this.guild, roleString).pipe(
              catchError((error) => {
                expect(error).to.be.an.instanceOf(RoleNotFoundError);
                expect(error.message).to.eq(`The role '${roleString}' could not be found`);
                return EMPTY;
              }),
            ).subscribe(() => done(new Error('Error was not raised')), (error) => done(error), () => done());
          });
        });

        context('when the role exists in the guild', function () {
          beforeEach(function () {
            this.role = new MockRole({
              client: this.chaos.discord,
              guild: this.guild,
              id: roleId,
              name: roleName,
            });
          });

          it('emits the found member', function (done) {
            this.roleService.findRole(this.guild, roleString).pipe(
              tap((role) => expect(role).to.eq(this.role)),
            ).subscribe(() => done(), (error) => done(error));
          });
        });
      });
    });
  });
});