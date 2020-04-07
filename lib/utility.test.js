const { asPromise } = require("./utility");

describe("asPromise", function () {
  context(`when given undefined`, function () {
    beforeEach(function () {
      this.value = undefined;
    });

    it('returns a promise', function () {
      expect(asPromise(this.value)).to.be.an.instanceOf(Promise);
    });

    it('resolves', async function () {
      let result = await asPromise(this.value);
      expect(result).to.eq(this.value);
    });
  });

  context(`when given a value`, function () {
    beforeEach(function () {
      this.value = 1;
    });

    it('returns a promise', function () {
      expect(asPromise(this.value)).to.be.an.instanceOf(Promise);
    });

    it('resolves as the value', async function () {
      let result = await asPromise(this.value);
      expect(result).to.eq(this.value);
    });
  });

  context(`when given a promise`, function () {
    beforeEach(function () {
      this.value = Promise.resolve();
    });

    it('returns the promise', function () {
      expect(asPromise(this.value)).to.eq(this.value);
    });
  });

  context(`when given an object that responds to toPromise()`, function () {
    beforeEach(function () {
      this.promise = Promise.resolve();
      this.value = { toPromise: () => this.promise };
    });

    it('returns the result of the call', function () {
      expect(asPromise(this.value)).to.eq(this.promise);
    });
  });
});
