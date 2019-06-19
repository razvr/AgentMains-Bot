const ChaosConfig = require('./chaos-config');

describe('ChaosConfig', function () {
  beforeEach(function () {
    this.options = {
      ownerUserId: "mock_ownerId",
      loginToken: "mock_loginToken",
    };

    this.chaosConfig = new ChaosConfig(this.options);
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
      "plugins",
      "messageOwnerOnBoot",
    ].forEach((attribute) => {
      it(attribute, function () {
        expect(this.chaosConfig[attribute]).not.to.be.undefined;
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
      ["plugins", "value"],
      ["commands", "value"],
      ["messageOwnerOnBoot", "value"],
      ["customField", "value"],
    ].forEach(([attribute, value]) => {
      it(`assigns ${attribute} from the options`, function () {
        this.options[attribute] = value;
        this.chaosConfig = new ChaosConfig(this.options);
        expect(this.chaosConfig[attribute]).to.eq(value);
      });
    });

    it('defaults the dataSource to "memory"', function () {
      expect(this.chaosConfig.dataSource.type).to.eq('memory');
    });

    it('defaults the defaultPrefix to "!"', function () {
      expect(this.chaosConfig.defaultPrefix).to.eq('!');
    });
  });

  describe('#verifyConfig', function () {
    context('when the ownerUserId is missing', function() {
      beforeEach(function () {
        this.chaosConfig.ownerUserId = null;
      });

      it('throws an error', function () {
        expect(() => this.chaosConfig.verifyConfig()).to.throw(
          ChaosConfig.InvalidConfigError, "ownerUserId is required",
        );
      });
    });

    context('when the loginToken is missing', function () {
      beforeEach(function () {
        this.chaosConfig.loginToken = null;
      });

      it('throws an error', function () {
        expect(() => this.chaosConfig.verifyConfig()).to.throw(
          ChaosConfig.InvalidConfigError, "loginToken is required",
        );
      });
    });
  });
});
