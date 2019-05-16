const Plugin = require('./plugin');
const createChaosStub = require('../test/create-chaos-stub');

describe('Plugin', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.options = { name: "test" };

    this.plugin = new Plugin(this.chaos, this.options);
  });

  describe('attributes', function () {
    [
      "name",
      "defaultData",
      "permissions",
      "services",
      "configActions",
      "commands",
    ].forEach((attribute) => {
      it(attribute, function () {
        expect(this.plugin[attribute]).not.to.be.undefined;
      });
    });
  });

  describe('constructor', function () {
    [
      ["name", "value"],
      ["defaultData", "value"],
      ["permissions", []],
      ["services", {}],
      ["configActions", "value"],
      ["commands", "value"],
      ["onListen", sinon.fake()],
      ["onEnabled", sinon.fake()],
      ["onDisabled", sinon.fake()],
      ["customField", "value"],
    ].forEach(([attribute, value]) => {
      it(`assigns ${attribute} from the options`, function () {
        this.options[attribute] = value;
        this.plugin = new Plugin(this.chaos, this.options);
        expect(this.plugin[attribute]).to.eq(value);
      });
    });
  });
});
