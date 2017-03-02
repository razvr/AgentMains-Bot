"use strict";

const Clapp = require('clapp');
const cfg = require('../../../config.js');
const parseSentence = require("minimist-string");
const str = require('./str-en.js');

class App extends Clapp.App {
  constructor(options) {
    super(options);
  }

  /**
   * Parses an input CLI sentence (See [isCliSentence]{@link App#isCliSentence}) and performs
   * actions accordingly:
   * if the sentence is a valid command, that command is executed. If it is an invalid CLI
   * sentence, the user is warned about the problem. If the user passes the "--help" flag, they
   * are prompted with the app general help, or the command specific help.
   *
   * Please note the following:
   *
   * - The input is not sanitized. It is your responsibility to do so.
   * - It would be a good idea to sanitize your input by using [validations]{@link validation}.
   * - It is also imperative that you make sure that the input is a CLI sentence (valid or
   * not) by using [isCliSentence]{@link App#isCliSentence}. Otherwise, Clapp will throw an error.
   *
   * @param {string} input A CLI sentence. See [isCliSentence]{@link App#isCliSentence}.
   * @param {*} [context] The context to retrieve later. See {@tutorial Working-with-contexts}.
   * @return {undefined}
   *
   * @example
   * app.parseInput("/testapp foo");        // Executes `foo`
   * app.parseInput("/testapp foo --bar");  // Executes `foo` passing the --bar flag
   * app.parseInput("/testapp foo --help"); // Shows the command help for `foo`
   * app.parseInput("/testapp --help");     // Shows the app help
   * app.parseInput("Not a CLI sentence");  // Throws an error. Make sure to validate
   *                                        // user input with App.isCliSentence();
   */
  parseInput(input, context) {
    if (typeof input !== "string") {
      throw new Error("Input must be a string! Don't forget to sanitize it.");
    }

    if (!this.isCliSentence(input)) {
      throw new Error(
        "Clapp: attempted to parse the input \"" + input + "\", " +
        "but it is not a CLI sentence (doesn't begin with the app prefix)."
      );
    }

    let argv = parseSentence(input.replace(this.prefix + this.separator, ""));

    // Find whether or not the requested command exists
    let cmd = null;
    let userInputCommand = argv._[0];
    for (let name in this.commands) {
      let command = this.commands[name];

      let validCommandName =
        command.caseSensitive ? name : name.toLowerCase();
      let validUserInput =
        command.caseSensitive ? userInputCommand : userInputCommand.toLowerCase();

      if (validCommandName === validUserInput) {
        cmd = command;
        break;
      }
    }

    if (!cmd) {
      // The command doesn't exist. Four scenarios possible:
      let {validPrefix, userPrefix} = this._getValidPrefixes(input);
      let validInput = this._getValidUserInput(input, userPrefix);

      if (argv.help || validInput === validPrefix) {
        // The help flag was passed OR the user typed just the command prefix.
        // Show app help.
        this.reply(this._getHelp(), context);
      }
      else if (argv.version) {
        // The user asked for the app version
        this.reply("v" + this.version, context);
      }
      else {
        // The user made a mistake. Let them know.
        this.reply(
          str.err + str.err_unknown_command.replace("%CMD%", argv._[0])
          + " " + str.err_type_help.replace("%PREFIX%", this.prefix), context
        );
      }
    }
    else {
      // The command exists. Three scenarios possible:
      if (argv.help) {
        // The user requested the command specific help.
        this.reply(cmd._getHelp(this), context);
      }
      else {
        // Find whether or not it supplies every required argument.
        let unfulfilled_args = {};
        let j = 1; // 1 because argv._[0] is the command name
        for (let i in cmd.args) {
          if (cmd.args[i].required && typeof argv._[j] === "undefined") {
            unfulfilled_args[i] = cmd.args[i];
          }

          j++;
        }

        if (Object.keys(unfulfilled_args).length > 0) {
          let r = str.err + str.err_unfulfilled_args + "\n";
          for (let i in unfulfilled_args) {
            r += i + "\n";
          }
          r += "\n" + str.err_type_help.replace(
              "%PREFIX%", this.prefix + " " + argv._[0]
            );

          this.reply(r, context);
        }
        else {
          let final_argv = {args: {}, flags: {}};
          let errors = [];

          // Give values to every argument
          j = 1;
          for (let i in cmd.args) {
            let arg = cmd.args[i];

            final_argv.args[i] = argv._[j];

            // If the arg wasn't supplied and it has a default value, use it
            if (typeof final_argv.args[i] === "undefined"
              && typeof arg.default !== "undefined") {
              final_argv.args[i] = arg.default;
            }

            // Convert it to the correct type, and register errors.
            final_argv.args[i] = App._convertType(
              final_argv.args[i], arg.type
            );

            if (typeof final_argv.args[i] === "object") {
              errors.push(
                "Error on argument " + i + ": expected "
                + final_argv.args[i].expectedType + ", got " +
                final_argv.args[i].providedType + " instead."
              );
            }
            else {
              // If the user input matches the required data type, perform every
              // validation, if there's any:
              for (let validation of arg.validations) {
                if (!validation.validate(final_argv.args[i])) {
                  errors.push(
                    "Error on argument " + i + ": " +
                    validation.errorMessage
                  );
                }
              }
            }

            j++;
          }

          // Give values to every flag
          for (let name in cmd.flags) {
            let flag = cmd.flags[name];
            let userValue = null;

            // Check if the user has passed the alias.
            // Otherwise check if the user has passed the flag.
            if (typeof argv[flag.alias] !== "undefined") {
              // The user has passed the alias.
              userValue = argv[flag.alias];
            }
            else {
              // If the flag is case sensitive, just check if the user has passed it
              if (flag.caseSensitive && typeof argv[name] !== "undefined") {
                userValue = argv[name];
              }
              else {
                // If not, compare every flag the user passed against this one.
                for (let userInputFlag in argv) {
                  // _ represents the command and arguments;
                  // we don't care about those.
                  if (userInputFlag !== "_" &&
                    name.toLowerCase() === userInputFlag.toLowerCase()) {

                    userValue = argv[userInputFlag];

                  }
                }
              }
            }

            final_argv.flags[name] = userValue !== null ? userValue : flag.default;

            // Convert it to the correct type, and register errors.
            final_argv.flags[name] = App._convertType(
              final_argv.flags[name], flag.type
            );

            if (typeof final_argv.flags[name] === "object") {
              errors.push(
                "Error on flag " + name + ": expected "
                + final_argv.flags[name].expectedType + ", got " +
                final_argv.flags[name].providedType + " instead."
              );
            }
            else {
              // If the user input matches the required data type, perform every
              // validation, if there's any:
              for (let k = 0; k < flag.validations.length; k++) {
                if (!flag.validations[k].validate(final_argv.flags[name])) {
                  errors.push(
                    "Error on flag " + name + ": " +
                    flag.validations[k].errorMessage
                  );
                }
              }
            }
          }

          // If we don't have any errors, we can execute the command
          let response;
          if (errors.length === 0) {
            /**
             * @typedef {Object} argv
             *
             * For more information, see {@tutorial Defining-the-command-function}.
             *
             * @property {Object} args  An object containing every argument.
             * @property {Object} flags An object containing every flag.
             *
             * @example
             *
             * {
						* 	args: {
						* 		myRequiredArg: 'foo',
						* 		myOptionalArgWithDefaultValue: 'bar',
						* 	},
						* 	flags: {
						* 		limit: 20,
						* 		debug: true
						* 	}
						* }
             */

            // The property async is deprecated, but we still give support to it
            if (!cmd.async) {
              response = cmd.fn(final_argv, context);

              if (response instanceof Promise) {
                // Even though the async attribute is set to false, the command
                // is actually async because it returned a promise.
                Promise.resolve(response).then(
                  actualResponse => {
                    // Note the difference between response and actual_response
                    // response is a Promise that will eventually return a value
                    // actualResponse is the value that was returned by the promise
                    if (typeof actualResponse === "string") {
                      this.reply(actualResponse, context);
                    }
                    else if (
                      typeof actualResponse === "object" &&
                      (
                        typeof actualResponse.message === "string" ||
                        typeof actualResponse.context !== "undefined"
                      )
                    ) {
                      this.reply(actualResponse.message, actualResponse.context);
                    }
                  }
                ).catch(
                  err => {
                    this.reply(
                      str.err_internal_error.replace(
                        "%CMD%",
                        cmd.name
                      ), context
                    );
                    console.error(err);
                  }
                );
              }
              else if (typeof response === "string") {
                this.reply(response, context);
              }
              else if (typeof response === "object" &&
                (
                  typeof response.message !== "string" ||
                  typeof response.context !== "undefined"
                )) {
                this.reply(response.message, response.context);
              }
            }
            else {
              let self = this;
              cmd.fn(
                final_argv,
                context,
                function cb(response, newContext) {
                  if (typeof response === "string") {
                    if (typeof newContext !== "undefined") {
                      self.reply(response, newContext);
                    }
                    else {
                      self.reply(response, context);
                    }
                  }
                }
              );

              if (!cmd.suppressDeprecationWarnings) {
                /* istanbul ignore next */
                console.warn(
                  "The Command.async property is deprecated. Please" +
                  " return a Promise instead; refer to the documentation.\n" +
                  "Set the suppressDeprecationWarnings property to true in" +
                  " order to ignore this warning."
                );
              }
            }
          }
          else {
            response = str.err + str.err_type_mismatch + "\n\n";
            for (let i = 0; i < errors.length; i++) {
              response += errors[i] + "\n";
            }
            this.reply(response, context);
          }
        }
      }
    }
  }

  _getHelp() {
    let r = str.help_cmd_list + '\n\n';

    for (let command in this.commands) {
      let cmdProps = this.commands[command];
      r += cfg.prefix + cfg.separator + command;

      if (Object.keys(cmdProps.args).length > 0) {
        for (let arg in cmdProps.args) {
          r += ' ' + (cmdProps.args[arg].required ? '<' + arg + '>' : '[' + arg + ']');
        }
      }

      r += '\n    ' + cmdProps.desc + '\n';
    }

    r += '\n' + str.help_usage + this.prefix + this.separator + str.help_command + '\n' +
      str.help_further_help
    ;

    r += '\n\nIf you have any suggestions for more things that I could do, drop a message in the' +
      ' #suggestion-box channel';

    return r;
  }
}

module.exports = App;
