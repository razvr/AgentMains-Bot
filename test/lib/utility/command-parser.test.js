let CommandParser = require('../../../lib/utility/command-parser');

describe('CommandParser', function () {
  describe('::isCommand', function () {
    context("when the message doesn't start with a valid prefix", function () {
      it('returns false', function () {
        let message = { content: "!test" };
        let prefixes = ['@'];
        expect(CommandParser.isCommand(message, prefixes)).to.equal(false);
      });
    });

    context('when the message does start with a valid prefix', function () {
      it('returns true', function () {
        let message = {content: "!test"};
        let prefixes = ['!'];
        expect(CommandParser.isCommand(message, prefixes)).to.equal(true);
      });
    });
  });
});
