const Rx = require('rx');
const chai = require("chai");
const sinonChai = require("sinon-chai");
const sinon = require('sinon').createSandbox();
const Factory = require("./../support/factory");

const expect = chai.expect;
chai.use(sinonChai);

const CommandParser = require('../../lib/utility/command-parser');

describe('CommandParser', function () {
  describe('::getCommandName', function () {
    context('when given a message with command', function () {
      let message;
      let prefix;

      beforeEach(function () {
        message = Factory.create('Message', {
          content: '!testCommand',
        });
        prefix = '!';
      });

      it('returns the command name', function () {
        let result = CommandParser.getCommandName(message, prefix);
        expect(result).to.eql('testcommand');
      });
    });

    context('when given a message with the wrong prefix', function () {
      let message;
      let prefix;

      beforeEach(function () {
        message = Factory.create('Message', {
          content: '?testCommand',
        });
        prefix = '!';
      });

      it('returns undefined', function () {
        let result = CommandParser.getCommandName(message, prefix);
        expect(result).to.be.undefined;
      });
    });

    context('when given a message that does not contain a command', function () {
      let message;
      let prefix;

      beforeEach(function () {
        message = Factory.create('Message', {
          content: 'testCommand',
        });
        prefix = '!';
      });

      it('returns undefined', function () {
        let result = CommandParser.getCommandName(message, prefix);
        expect(result).to.be.undefined;
      });
    });
  });

  describe('::getParams', function () {
    let command;
    let message;

    context("when the command has no arguments", function () {
      beforeEach(function () {
        command = Factory.create('Command', {
          args: [],
        });
      });

      context('when the message has no arguments', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name}`,
          });
        });

        it('returns no parsed args', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.args).to.eql({});
        });
      });

      context('when the message has arguments', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} param1 param2 param3`,
          });
        });

        it('returns no parsed args', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.args).to.eql({});
        });
      });
    });

    context("when the command has arguments without defaults", function () {
      beforeEach(function () {
        command = Factory.create('Command', {
          args: [
            {name: 'param1'},
            {name: 'param2'},
            {name: 'param3'},
          ],
        });
      });

      context('when the message has no arguments', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name}`,
          });
        });

        it('returns no parsed args', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.args).to.eql({
            'param1': undefined,
            'param2': undefined,
            'param3': undefined,
          });
        });
      });

      context('when the message has all arguments', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} value1 value2 value3`,
          });
        });

        it('returns parsed args', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.args).to.eql({
            'param1': 'value1',
            'param2': 'value2',
            'param3': 'value3',
          });
        });
      });
    });

    context("when the command has arguments with defaults", function () {
      beforeEach(function () {
        command = Factory.create('Command', {
          args: [
            {name: 'param1', default: 'default1'},
            {name: 'param2', default: 'default2'},
            {name: 'param3', default: 'default3'},
          ],
        });
      });

      context('when the message has no arguments', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name}`,
          });
        });

        it('returns no parsed args', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.args).to.eql({
            'param1': 'default1',
            'param2': 'default2',
            'param3': 'default3',
          });
        });
      });

      context('when the message has some arguments', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} value1`,
          });
        });

        it('defaults the missing arguments', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.args).to.eql({
            'param1': 'value1',
            'param2': 'default2',
            'param3': 'default3',
          });
        });
      });

      context('when the message has all arguments', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} value1 value2 value3`,
          });
        });

        it('returns parsed args', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.args).to.eql({
            'param1': 'value1',
            'param2': 'value2',
            'param3': 'value3',
          });
        });
      });
    });

    context("when the command has no flags", function () {
      beforeEach(function () {
        command = Factory.create('Command', {
          flags: [],
        });
      });

      context('when the message has no flags', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name}`,
          });
        });

        it('returns no parsed (non-built in) flags', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.flags).to.eql({
            'help': false,
          });
        });
      });

      context('when the message has some flags', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} --flag1`,
          });
        });

        it('returns no parsed (non-built in) flags', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.flags).to.eql({
            'help': false,
          });
        });
      });
    });

    context("when the command has boolean flags", function () {
      beforeEach(function () {
        command = Factory.create('Command', {
          flags: [
            {name: 'flag1', shortAlias: 'a', type: 'boolean'},
            {name: 'flag2', shortAlias: 'b', type: 'boolean'},
            {name: 'flag3', shortAlias: 'c', type: 'boolean'},
          ],
        });
      });

      context('when the message has no flags', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name}`,
          });
        });

        it('returns parsed flags', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.flags).to.eql({
            'help': false,
            'flag1': false,
            'flag2': false,
            'flag3': false,
          });
        });
      });

      context('when the message has flags', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} --flag1 --flag2 --flag3`,
          });
        });

        it('returns parsed flags', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.flags).to.eql({
            'help': false,
            'flag1': true,
            'flag2': true,
            'flag3': true,
          });
        });
      });

      context('when the message has short alias flags', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} -a -b -c`,
          });
        });

        it('returns parsed flags', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.flags).to.eql({
            'help': false,
            'flag1': true,
            'flag2': true,
            'flag3': true,
          });
        });
      });
    });

    context("when the command has non-boolean flags", function () {
      beforeEach(function () {
        command = Factory.create('Command', {
          flags: [
            {name: 'flag1', shortAlias: 'a', type: 'string'},
            {name: 'flag2', shortAlias: 'b', type: 'string'},
            {name: 'flag3', shortAlias: 'c', type: 'string'},
          ],
        });
      });

      context('when the message has no flags', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name}`,
          });
        });

        it('returns parsed flags', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.flags).to.eql({
            'help': false,
            'flag1': undefined,
            'flag2': undefined,
            'flag3': undefined,
          });
        });
      });

      context('when the message has flags', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} --flag1 value1 --flag2 value2 --flag3 value3`,
          });
        });

        it('returns parsed flags', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.flags).to.eql({
            'help': false,
            'flag1': 'value1',
            'flag2': 'value2',
            'flag3': 'value3',
          });
        });
      });

      context('when the message has short alias flags', function () {
        beforeEach(function () {
          message = Factory.create('Message', {
            content: `!${command.name} -a value1 -b value2 -c value3`,
          });
        });

        it('returns parsed flags', function () {
          let params = CommandParser.getParams(command, message);
          expect(params.flags).to.eql({
            'help': false,
            'flag1': 'value1',
            'flag2': 'value2',
            'flag3': 'value3',
          });
        });
      });
    });
  });
});
