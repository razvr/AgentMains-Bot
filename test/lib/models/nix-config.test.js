const NixConfig = require('../../../lib/models/chaos-config');

describe('NixConfig', function () {
  beforeEach(function () {
    this.options = {
      ownerUserId: "mock_ownerId",
      loginToken: "mock_loginToken",
    };

    this.nixConfig = new NixConfig(this.options);
  });

  describe('attributes', function () {
    [
      "ownerUserId",
      "loginToken",
      "discord",
      "dataSource",
      "logger",
      "responseStrings",
      "defaultPrefix",
      "services",
      "modules",
      "commands",
      "messageOwnerOnBoot",
    ].forEach((attribute) => {
      it(attribute, function () {
        expect(this.nixConfig[attribute]).not.to.be.undefined;
      });
    });
  });

  describe('constructor', function () {
    [
      ["ownerUserId", "value"],
      ["loginToken", "value"],
      ["discord", "value"],
      ["dataSource", "value"],
      ["logger", "value"],
      ["responseStrings", "value"],
      ["defaultPrefix", "value"],
      ["services", "value"],
      ["modules", "value"],
      ["commands", "value"],
      ["messageOwnerOnBoot", "value"],
      ["customField", "value"],
    ].forEach(([attribute, value]) => {
      it(`assigns ${attribute} from the options`, function () {
        this.options[attribute] = value;
        this.nixConfig = new NixConfig(this.options);
        expect(this.nixConfig[attribute]).to.eq(value);
      });
    });

    it('defaults the dataSource to "memory"', function () {
      expect(this.nixConfig.dataSource.type).to.eq('memory');
    });

    it('defaults the defaultPrefix to "!"', function () {
      expect(this.nixConfig.defaultPrefix).to.eq('!');
    });
  });

  describe('#verifyConfig', function () {
    context('when the ownerUserId is missing', function() {
      beforeEach(function () {
        this.nixConfig.ownerUserId = null;
      });

      it('throws an error', function () {
        expect(() => this.nixConfig.verifyConfig()).to.throw(
          NixConfig.InvalidConfigError, "ownerUserId is required",
        );
      });
    });

    context('when the loginToken is missing', function () {
      beforeEach(function () {
        this.nixConfig.loginToken = null;
      });

      it('throws an error', function () {
        expect(() => this.nixConfig.verifyConfig()).to.throw(
          NixConfig.InvalidConfigError, "loginToken is required",
        );
      });
    });
  });
});
