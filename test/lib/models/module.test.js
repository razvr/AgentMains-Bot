const Plugin = require('../../../lib/models/plugin');

describe('Plugin', function () {
  beforeEach(function () {
    this.options = {name: "test"};

    this.module = new Plugin(this.options);
  });

  describe('attributes', function () {
    [
      "name",
      "enabledByDefault",
      "canBeDisabled",
      "defaultData",
      "permissions",
      "services",
      "configActions",
      "commands",
    ].forEach((attribute) => {
      it(attribute, function () {
        expect(this.module[attribute]).not.to.be.undefined;
      });
    });
  });

  describe('constructor', function () {
    [
      ["name", "value"],
      ["enabledByDefault", "value"],
      ["canBeDisabled", "value"],
      ["defaultData", "value"],
      ["permissions", []],
      ["services", {}],
      ["configActions", "value"],
      ["commands", "value"],
      ["onNixListen", sinon.fake()],
      ["onEnabled", sinon.fake()],
      ["onDisabled", sinon.fake()],
      ["customField", "value"],
    ].forEach(([attribute, value]) => {
      it(`assigns ${attribute} from the options`, function () {
        this.options[attribute] = value;
        this.module = new Plugin(this.options);
        expect(this.module[attribute]).to.eq(value);
      });
    });
  });
});
