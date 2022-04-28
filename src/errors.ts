import * as fs from "fs";
import * as path from "path";
import { trace } from "./utils";
import { red, bold } from "colors";
import { ErrorTypes } from "./types";

function err(message: string, source?: fs.PathLike, charac?: number): void {
  var pos: any;
  if (source !== undefined && charac !== undefined) pos = trace(source, charac);
  message = bold(
    red(
      `${message}` +
        (source
          ? `\n    at ${path.resolve(source.toString())}${
              charac !== undefined ? `:${pos.line}:${pos.col}` : ""
            }`
          : "")
    )
  );
  throw new Error(message);
}

const Errors = {
  enc(type: ErrorTypes, source: fs.PathLike, charac?: number, options?: any) {
    switch (type) {
      case "FILE_NON_EXISTENT":
        err(`Siphon could not find ${source.toString()}.`);
      case "NO_ROOTDIR":
        err(`The rootDir '${source}' does not exist.`);
      case "SOMETHING_WENT_WRONG":
        err(`Something went wrong while parsing your Javascript text.`, source);
      case "CSS_NON_EXISTENT":
        err(`The stylesheet '${source.toString()}' cannot be found.`);
      case "CSS_SELF_IMPORT":
        err(
          `recursion_hell: The stylesheet ${source.toString()} has an import to itself.`
        );
      case "HTML_SELF_INJECT":
        err(
          `recursion_hell: The HTML file ${source.toString()} has an inject to itself.`
        );
      case "CSS_CIRCULAR_IMPORT":
        err(
          `The stylesheet ${source.toString()} has already been imported into this project.`
        );
      case "CSS_STRING_OR_URI_EXPECTED":
        err("String or URL expected.", source, charac);
      case "OPEN_BRAC_EXPECTED":
        err("'(' was expected.", source, charac);
      case "CLOSING_BRAC_EXPECTED":
        err("')' was expected.", source, charac);
      case "CLOSING_CURL_EXPECTED":
        err("'}' was expected.", source, charac);
      case "CLOSING_SQUARE_BRAC_EXPECTED":
        err("']' was expected.", source, charac);
      case "SEMI_COLON_EXPECTED":
        err("Semicolon expected.", source, charac);
      case "COLON_EXPECTED":
        err("':' expected.", source, charac);
      case "CSS_OPEN_CURL_EXPECTED":
        err("'{' expected.", source, charac);
      case "CATCH_NEW_PARAM":
        err("A catch block can only have one paramater.", source, charac);
      case "CATCH_ASSIGN":
        err("A catch parameter must not have an initializer.");
      case "CONST_INIT":
        err("const variables must be initialized.", source, charac);
      case "DESTRUCTURING_ERROR":
        err("Destructured variables must have an initializer.", source, charac);
      case "CSS_INVALID_IDENTIFIER":
        err("Invalid CSS Identifier.", source, charac);
      case "JS_INVALID_IDENTIFIER":
        err("Invalid identifier.", source, charac);
      case "HTML_CIRCULAR_INJECT":
        err(`Circular injection detected in ${source.toString()}.`);
      case "NOT_A_DIRECTORY":
        err(`The path ${source.toString()} does not lead to a directory.`);
      case "COMMENT_UNCLOSED":
        err(`Siphon encountered an unclosed comment.`, source, charac);
      case "TAG_UNCLOSED":
        err(`Expected a start tag.`, source, charac);
      case "HTML_FRAGMENT":
        err(`Siphon does not support HTML fragments.`, source, charac);
      case "UNCLOSED_BLOCK_COMMENT":
        err("*/ expected.", source, charac);
      case "JS_UNEXPECTED_TOKEN":
        err(`Unexpected token '${options.token}'.`, source, charac);
      case "JS_ARGUMENT_EXPRESSION_EXPECTED":
        err(`Argument expression expected.`, source, charac);
      case "JS_INVALID_REGEX_FLAG":
        err(`Invalid regular expression flag.`, source, charac);
      case "JS_WHILE_EXPECTED":
        err(`'while' expected.`, source, charac);
      case "JS_INVALID_LHS_POFTIX":
        err(
          `Invalid left-hand side expression in postfix operation.`,
          source,
          charac
        );
      case "JS_PARAM_DEC_EXPECTED":
        err("Parameter declaration expected.", source, charac);
      case "JS_PARAM_CLASH":
        err(
          `The parameter '${options.token}' has already been declared.'`,
          source,
          charac
        );
      case "JS_INVALID_LHS_PREFIX":
        err(
          `Invalid left-hand side expression in prefix operation.`,
          source,
          charac
        );
      case "JS_INVALID_LHS_ASSIGN":
        err(`Invalid left-hand side in assignment.`, source, charac);
      case "JS_ILLEGAL_CASE":
        err(
          "A case can only be used within a switch statement.",
          source,
          charac
        );
      case "JS_EXPORT_EXPECTED":
        err("'export' expected.", source, charac);
      case "JS_ILLEGAL_ELSE":
        err("Unexpected else statement.", source, charac);
      case "INVALID_NEW_META_PROPERTY":
        err(
          `'${options.token}' is not a valid meta-property for keyword 'new'. Did you mean 'target'?`,
          source,
          charac
        );
      case "INVALID_TAG":
        err(`Invalid tag Name '${options.name}'`, source, charac);
      case "MODULE_REQUIRES_SRC":
        err(`HTML module tags require a src attribute.`);
      case "INVALID_VOID_TAG":
        err(`'${options.name}' cannot be used as a void tag.`, source, charac);
      case "ABRUPT":
        err(`Unexpected end of file.`, source);
      case "CLOSING_TAG_ATTR":
        err(`Attributes are not allowed in the closing tag.`, source, charac);
      case "UNEXPECTED_CLOSE":
        err(`Encountered unexpected closing tag.`, source, charac);
      case "OPEN_CURLY_EXPECTED":
        err(`Siphon expected a {`, source, charac);
      case "UNSUPPORTED_IMAGE_FORMAT":
        err(
          `${options.src} is not a supported image format. \n\n To stop image checking, set checkImageTypes to false in your config file.`,
          source,
          charac
        );
      case "JS_UNEXP_KEYWORD_OR_IDENTIFIER":
        err(`Unexpected keyword or Identifier.`, source, charac);
      case "UNTERMINATED_STRING_LITERAL":
        err(
          `Siphon encountered an unterminated string literal.`,
          source,
          charac
        );
      case "UNTERMINATED_REGEX_LITERAL":
        err(
          `Siphon encountered an unterminated regular expression literal.`,
          source,
          charac
        );
      case "EXPECTED":
        err(`'${options.token}' expected.`, source, charac);
      case "COMMA_EXPECTED":
        err(`A ',' was expected.`, source, charac);
      case "JS_CASE_EXPECTED":
        err("'case' or 'default' expected.", source, charac);
      case "EXPRESSION_EXPECTED":
        err("An expression was expected.", source, charac);
      case "VARIABLE_DECLARATION_EXPECTED":
        err("Variable declaration or statement expected.", source, charac);
      case "JS_DEC_OR_STATEMENT_EXPECTED":
        err("Declaration or statement expected", source, charac);
      case "JS_ILLEGAL_IMPORT":
        err(
          "An import statement can only be used at the top level of a module.",
          source,
          charac
        );
      case "IDENTIFIER_EXPECTED":
        err("Identifier expected.", source, charac);
      case "EMPTY_CONST_DECLARATION":
        err("'const' declarations must be initialized.", source, charac);
      case "BIGINT_DECIMAL":
        err("A bigint literal must be an integer.", source, charac);
      case "ID_FOLLOWS_LITERAL":
        err(
          "An identifier or keyword cannot immediately follow a numeric literal.",
          source,
          charac
        );
      case "MISSING_DESC_INITIALIZER":
        err("Destructured variables must have an initializer.", source, charac);
      case "INVALID_ASSIGNMENT_LEFT":
        err("Invalid left-hand side in assignment.", source, charac);
      case "SHEBANG_NOT_ALLOWED":
        err("Shebang comments are not suppoerted in the browser.");
    }
  },
  custom(message: string, source: fs.PathLike, charac?: number) {
    err(message, source, charac);
  },
};

export default Errors;
