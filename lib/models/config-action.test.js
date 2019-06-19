const ConfigAction = require('./config-action');

describe('ConfigAction', function () {
  beforeEach(function () {
    this.chaos = {};
    this.options = { name: "test" };

    this.configAction = new ConfigAction(this.chaos, this.options);
  });

  describe('attributes', function () {
    [
      "name",
      "description",
      "inputs",
      "run",
    ].forEach((attribute) => {
      it(attribute, function () {
        expect(this.configAction[attribute]).not.to.be.undefined;
      });
    });
  });

  describe('constructor', function () {
    [
      ["name", "value"],
      ["description", "value"],
      ["services", {}],
      ["inputs", []],
      ["run", sinon.fake()],
      ["customAttr", "value"],
    ].forEach(([attribute, value]) => {
      it(`assigns ${attribute} from the options`, function () {
        this.options[attribute] = value;
        this.configAction = new ConfigAction(this.chaos, this.options);
        expect(this.configAction[attribute]).to.eq(value);
      });
    });
  });
});
