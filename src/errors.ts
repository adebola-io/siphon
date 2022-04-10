import * as fs from "fs";
import * as path from "path";
import { trace } from "./utils";
import { red, bold } from "colors";
import { ErrorTypes } from "./types";

function err(message: string, source?: fs.PathLike, charac?: number): void {
  var pos: any;
  if (source && charac) pos = trace(source, charac);
  message = bold(
    red(
      `${message} ${
        source
          ? `\n    at ${path.resolve(source.toString())}${
              charac ? `:${pos.line}:${pos.col}` : ""
            }`
          : ""
      }`
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
      case "CSS_NON_EXISTENT":
        err(`The stylesheet '${source.toString()}' cannot be found.`);
      case "CSS_SELF_IMPORT":
        err(
          `recursion_hell: The stylesheet ${source.toString()} has an import to itself.`
        );
      case "CSS_CIRCULAR_IMPORT":
        err(
          `The stylesheet ${source.toString()} has already been imported into this project.`
        );
      case "NOT_A_DIRECTORY":
        err(`The path ${source.toString()} does not lead to a directory.`);
      case "COMMENT_UNCLOSED":
        err(`Siphon encountered an unclosed comment.`, source, charac);
      case "TAG_UNCLOSED":
        err(`Expected a start tag.`, source, charac);
      case "HTML_FRAGMENT":
        err(`Siphon does not support HTML fragments.`, source, charac);
      case "INVALID_TAG":
        err(`Invalid tag Name '${options.name}'`, source, charac);
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
      case "COMMA_EXPECTED":
        err(`A ',' was expected.`, source, charac);
      case "EXPRESSION_EXPECTED":
        err("An expression was expected.", source, charac);
      case "VARIABLE_DECLARATION_EXPECTED":
        err("Variable declaration or statement expected.", source, charac);
      case "IDENTIFIER_EXPECTED":
        err("Idenitifier expected.", source, charac);
      case "EMPTY_CONST_DECLARATION":
        err("'const' declarations must be initialized.", source, charac);
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
    }
  },
};

export default Errors;
